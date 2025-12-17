const EmploiDuTemps = require("../models/emploiDuTempsSchema");
const Seance = require("../models/seanceSchema");
const Cours = require("../models/coursSchema");
const Classe = require("../models/classeSchema");
const User = require("../models/userSchema");
const Notification = require("../models/notificationSchema");

/* ===========================================================
   🟢 CREATE EMPLOI DU TEMPS
=========================================================== */
module.exports.createEmploi = async (req, res) => {
  try {
    const { titre, description, dateDebut, dateFin, classe: classeId, seances } = req.body;

    if (!titre || !dateDebut || !dateFin || !classeId) {
      return res.status(400).json({ message: "Tous les champs obligatoires ne sont pas remplis." });
    }

    // Verify classe exists
    const classe = await Classe.findById(classeId).populate("etudiants", "_id prenom nom");
    if (!classe) return res.status(404).json({ message: "Classe introuvable." });

    // Create emploi du temps
    const newEmploiDuTemps = new EmploiDuTemps({
      titre,
      description,
      dateDebut,
      dateFin,
      classe: classeId,
      creePar: req.user.id,
    });
    await newEmploiDuTemps.save();

    // Create seances if provided
    const createdSeances = [];
    if (seances && Array.isArray(seances) && seances.length > 0) {
      for (const seanceData of seances) {
        const { dateDebut: sDateDebut, dateFin: sDateFin, jourSemaine, heureDebut, heureFin, salle, typeCours, cours } = seanceData;

        if (!sDateDebut || !sDateFin || !jourSemaine || !heureDebut || !heureFin || !salle || !typeCours || !cours) {
          await EmploiDuTemps.findByIdAndDelete(newEmploiDuTemps._id);
          return res.status(400).json({ message: "Tous les champs des séances sont obligatoires." });
        }

        // Verify cours exists
        const coursDoc = await Cours.findById(cours);
        if (!coursDoc) {
          await EmploiDuTemps.findByIdAndDelete(newEmploiDuTemps._id);
          return res.status(404).json({ message: "Cours introuvable." });
        }

        // Check for time conflicts within the emploi du temps
        const existingSeances = await Seance.find({ emploiDuTemps: newEmploiDuTemps._id, jourSemaine });
        const conflict = existingSeances.some(s => {
          return (
            (heureDebut >= s.heureDebut && heureDebut < s.heureFin) ||
            (heureFin > s.heureDebut && heureFin <= s.heureFin) ||
            (heureDebut <= s.heureDebut && heureFin >= s.heureFin)
          );
        });

        if (conflict) {
          await EmploiDuTemps.findByIdAndDelete(newEmploiDuTemps._id);
          return res.status(400).json({ message: "Conflit : une autre séance est déjà prévue à cette période." });
        }

        const newSeance = new Seance({
          dateDebut: sDateDebut,
          dateFin: sDateFin,
          jourSemaine,
          heureDebut,
          heureFin,
          salle,
          typeCours,
          cours,
          classe: classeId,
          emploiDuTemps: newEmploiDuTemps._id,
        });
        await newSeance.save();
        createdSeances.push(newSeance._id);

        // Update cours and classe
        await Cours.findByIdAndUpdate(cours, { $addToSet: { seances: newSeance._id } });
        await Classe.findByIdAndUpdate(classeId, { $addToSet: { seances: newSeance._id } });
      }

      // Update emploi du temps with seances
      await EmploiDuTemps.findByIdAndUpdate(newEmploiDuTemps._id, { seances: createdSeances });
    }

    // Update classe
    await Classe.findByIdAndUpdate(classeId, { $addToSet: { emplois: newEmploiDuTemps._id } });

    // Send notifications
    await sendEmploiNotification(req, classe, `📅 Nouvel emploi du temps "${titre}" ajouté pour la classe "${classe.nom}".`);

    res.status(201).json({ message: "Emploi du temps créé avec succès ✅", emploi: newEmploiDuTemps });

  } catch (error) {
    console.error("❌ Erreur createEmploi:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


/* ===========================================================
   ✏️ UPDATE EMPLOI DU TEMPS
=========================================================== */
module.exports.updateEmploi = async (req, res) => {
  try {
    const updatedEmploi = await EmploiDuTemps.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("seances");
    if (!updatedEmploi) return res.status(404).json({ message: "Emploi du temps introuvable." });

    const classe = await Classe.findById(updatedEmploi.classe).populate("etudiants", "_id prenom nom");

    await sendEmploiNotification(req, classe, `✏️ L’emploi du temps "${updatedEmploi.titre}" a été modifié.`);

    res.status(200).json({ message: "Emploi du temps mis à jour ✅", emploi: updatedEmploi });
  } catch (error) {
    console.error("❌ Erreur updateEmploi:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE EMPLOI DU TEMPS
=========================================================== */
module.exports.deleteEmploi = async (req, res) => {
  try {
    const deletedEmploi = await EmploiDuTemps.findByIdAndDelete(req.params.id);
    if (!deletedEmploi) return res.status(404).json({ message: "Emploi du temps introuvable." });

    // Delete associated seances
    await Seance.deleteMany({ emploiDuTemps: deletedEmploi._id });

    // Update classe and cours
    await Classe.findByIdAndUpdate(deletedEmploi.classe, { $pull: { emplois: deletedEmploi._id } });
    await Cours.updateMany({}, { $pull: { emplois: deletedEmploi._id, seances: { $in: deletedEmploi.seances } } });
    await Classe.findByIdAndUpdate(deletedEmploi.classe, { $pull: { seances: { $in: deletedEmploi.seances } } });

    const classe = await Classe.findById(deletedEmploi.classe).populate("etudiants", "_id prenom nom");
    await sendEmploiNotification(req, classe, `🚫 L’emploi du temps "${deletedEmploi.titre}" a été annulé.`);

    res.status(200).json({ message: "Emploi du temps supprimé avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteEmploi:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL EMPLOIS DU TEMPS
=========================================================== */
module.exports.getAllEmplois = async (req, res) => {
  try {
    let emplois;
    if (req.user.role === "etudiant") {
      const user = await User.findById(req.user.id).populate("classe");
      if (!user?.classe) return res.status(404).json({ message: "Classe introuvable." });
      emplois = await EmploiDuTemps.find({ classe: user.classe._id })
        .populate({
          path: "seances",
          select: "jourSemaine heureDebut heureFin salle typeCours cours",
          populate: {
            path: "cours",
            select: "nom code enseignant",
            populate: {
              path: "enseignant",
              select: "prenom nom"
            }
          }
        })
        .populate("classe", "nom annee specialisation");
    } else if (req.user.role === "enseignant") {
      emplois = await EmploiDuTemps.find()
        .populate({
          path: "seances",
          select: "jourSemaine heureDebut heureFin salle typeCours cours",
          populate: {
            path: "cours",
            match: { enseignant: req.user.id },
            select: "nom code enseignant",
            populate: {
              path: "enseignant",
              select: "prenom nom"
            }
          }
        })
        .populate("classe", "nom annee specialisation");

      // Filter out emplois with no matching seances
      emplois = emplois.filter(emploi => emploi.seances && emploi.seances.some(seance => seance.cours !== null));
    } else {
      emplois = await EmploiDuTemps.find()
        .populate({
          path: "seances",
          select: "jourSemaine heureDebut heureFin salle typeCours cours",
          populate: {
            path: "cours",
            select: "nom code enseignant",
            populate: {
              path: "enseignant",
              select: "prenom nom"
            }
          }
        })
        .populate("classe", "nom annee specialisation");
    }
    res.status(200).json(emplois);
  } catch (error) {
    console.error("❌ Erreur getAllEmplois:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET EMPLOI BY ID
=========================================================== */
module.exports.getEmploiById = async (req, res) => {
  try {
    const emploi = await EmploiDuTemps.findById(req.params.id)
      .populate("cours", "nom code")
      .populate("classe", "nom annee specialisation");
    if (!emploi) return res.status(404).json({ message: "Emploi introuvable." });
    res.status(200).json(emploi);
  } catch (error) {
    console.error("❌ Erreur getEmploiById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE ALL EMPLOIS
=========================================================== */
module.exports.deleteAllEmplois = async (req, res) => {
  try {
    await EmploiDuTemps.deleteMany({});
    await Classe.updateMany({}, { $set: { emplois: [] } });
    await Cours.updateMany({}, { $set: { emplois: [] } });
    res.status(200).json({ message: "Tous les emplois du temps ont été supprimés ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteAllEmplois:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ⚙️ UTIL: SEND NOTIFICATIONS
=========================================================== */
async function sendEmploiNotification(req, classe, message) {
  try {
    if (!classe?.etudiants?.length) return;

    const io = req.io;
    if (!io) {
      console.warn("⚠️ io non trouvé dans req.app (socket non initialisé)");
      return;
    }

    for (const etu of classe.etudiants) {
      const notif = await Notification.create({
        message,
        type: "rappel",
        utilisateur: etu._id,
      });

      await User.findByIdAndUpdate(etu._id, { $push: { notifications: notif._id } });

      io.to(etu._id.toString()).emit("receiveNotification", {
        message,
        type: "rappel",
        date: new Date(),
      });
    }
  } catch (err) {
    console.error("⚠️ Erreur lors de l’envoi des notifications :", err);
  }
}
