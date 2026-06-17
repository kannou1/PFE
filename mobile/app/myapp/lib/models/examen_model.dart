// ─── ExamenModel ───────────────────────────────────────────────────────────────
// Matches backend examenSchema (inferred from routes)

class ExamenModel {
  final String id;
  final String titre;
  final String? description;
  final String type; // 'final', 'midterm', 'quiz'
  final double noteTotale;
  final DateTime dateExamen;
  final String classeId;
  final String coursId;
  final String enseignantId;
  final List<String> etudiantsInscrits;

  const ExamenModel({
    required this.id,
    required this.titre,
    this.description,
    required this.type,
    required this.noteTotale,
    required this.dateExamen,
    required this.classeId,
    required this.coursId,
    required this.enseignantId,
    this.etudiantsInscrits = const [],
  });

  factory ExamenModel.fromJson(Map<String, dynamic> json) {
    final rawTitre = json['titre'] ?? json['nom'] ?? json['title'];
    final rawType = json['type'];

    // Backend inconsistencies: sometimes fields are named differently.
    final rawDate = json['dateExamen'] ?? json['date'];
    final rawClasse = json['classe'] ?? json['classeId'] ?? json['classe_id'];
    final rawCours = json['cours'] ?? json['coursId'];
    final rawEnseignant = json['enseignant'] ?? json['enseignantId'];

    final dateStr = rawDate?.toString();
    final DateTime parsedDate =
        (dateStr != null && dateStr.isNotEmpty)
            ? DateTime.tryParse(dateStr) ?? DateTime.fromMillisecondsSinceEpoch(0)
            : DateTime.fromMillisecondsSinceEpoch(0);

    double parsedNoteTotale;
    final rawNoteTotale = json['noteTotale'] ?? json['noteMax'] ?? json['noteMaxima'];
    if (rawNoteTotale is num) {
      parsedNoteTotale = rawNoteTotale.toDouble();
    } else {
      parsedNoteTotale = double.tryParse(rawNoteTotale?.toString() ?? '') ?? 20.0;
    }

    return ExamenModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      titre: rawTitre?.toString() ?? '',
      description: json['description']?.toString(),
      type: rawType?.toString() ?? '',
      noteTotale: parsedNoteTotale,
      dateExamen: parsedDate,
      classeId: rawClasse?.toString() ?? '',
      coursId: rawCours?.toString() ?? '',
      enseignantId: rawEnseignant?.toString() ?? '',
      etudiantsInscrits: _parseStringList(json['etudiantsInscrits'] ?? json['etudiants']),
    );
  }


  Map<String, dynamic> toJson() => {
    '_id': id,
    'titre': titre,
    if (description != null) 'description': description,
    'type': type,
    'noteTotale': noteTotale,
    'dateExamen': dateExamen.toIso8601String(),
    'classe': classeId,
    'cours': coursId,
    'enseignant': enseignantId,
    if (etudiantsInscrits.isNotEmpty) 'etudiantsInscrits': etudiantsInscrits,
  };

  static List<String> _parseStringList(dynamic v) {
    if (v == null) return [];
    if (v is List) return v.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
    return [];
  }

  @override
  String toString() => 'ExamenModel(id: $id, $titre [$type] $noteTotale pts)';
}

