// ─── EmploiDuTempsModel ────────────────────────────────────────────────────────
// Matches backend emploiDuTempsSchema

class EmploiDuTempsModel {
  final String id;
  // Backend timetable entries are returned as `seances` objects inside this `EmploiDuTemps` document.
  final String classeId;
  final List<SeanceEntry> seances;

  const EmploiDuTempsModel({
    required this.id,
    required this.classeId,
    required this.seances,
  });


  factory EmploiDuTempsModel.fromJson(Map<String, dynamic> json) {
    String asString(dynamic v, {String fallback = ''}) {
      if (v == null) return fallback;
      if (v is String) return v;
      return v.toString();
    }

    final rawSeances = (json['seances'] as List?) ?? [];

    return EmploiDuTempsModel(
      id: asString(json['_id'] ?? json['id']),
      classeId: asString(json['classe'] ?? json['classeId']),
      seances: rawSeances.map((e) => SeanceEntry.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    '_id': id,
    'classe': classeId,
    'seances': seances.map((s) => s.toJson()).toList(),
  };

  @override
  String toString() => 'EmploiDuTempsModel(id: $id, classeId: $classeId, seances: ${seances.length})';
}

class SeanceEntry {
  final String id;
  final String jourSemaine;
  final String heureDebut;
  final String heureFin;
  final String salle;
  final String typeCours;
  final String? type;
  final CoursRef? cours;

  const SeanceEntry({
    required this.id,
    required this.jourSemaine,
    required this.heureDebut,
    required this.heureFin,
    required this.salle,
    required this.typeCours,
    required this.type,
    required this.cours,
  });

  factory SeanceEntry.fromJson(Map<String, dynamic> json) {
    String asString(dynamic v, {String fallback = ''}) {
      if (v == null) return fallback;
      if (v is String) return v;
      return v.toString();
    }

    return SeanceEntry(
      id: asString(json['_id'] ?? json['id']),
      jourSemaine: asString(json['jourSemaine']),
      heureDebut: asString(json['heureDebut']),
      heureFin: asString(json['heureFin']),
      salle: asString(json['salle']),
      typeCours: asString(json['typeCours'] ?? json['type']),
      type: json['type']?.toString(),
      cours: json['cours'] != null ? CoursRef.fromJson(json['cours'] as Map<String, dynamic>) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    '_id': id,
    'jourSemaine': jourSemaine,
    'heureDebut': heureDebut,
    'heureFin': heureFin,
    'salle': salle,
    'typeCours': typeCours,
    'type': type,
    'cours': cours?.toJson(),
  };
}

class CoursRef {
  final String? id;
  final String? nom;
  final String? name;
  final EnseignantRef? enseignant;

  const CoursRef({this.id, this.nom, this.name, this.enseignant});

  factory CoursRef.fromJson(Map<String, dynamic> json) {
    String? asNullableString(dynamic v) {
      if (v == null) return null;
      if (v is String) return v;
      return v.toString();
    }

    return CoursRef(
      id: asNullableString(json['_id'] ?? json['id']),
      nom: asNullableString(json['nom']),
      name: asNullableString(json['name']),
      enseignant: json['enseignant'] != null ? EnseignantRef.fromJson(json['enseignant'] as Map<String, dynamic>) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    '_id': id,
    'nom': nom,
    'name': name,
    'enseignant': enseignant?.toJson(),
  };
}

class EnseignantRef {
  final String? prenom;
  final String? nom;

  const EnseignantRef({this.prenom, this.nom});

  factory EnseignantRef.fromJson(Map<String, dynamic> json) {
    String? asNullableString(dynamic v) {
      if (v == null) return null;
      if (v is String) return v;
      return v.toString();
    }

    return EnseignantRef(
      prenom: asNullableString(json['prenom']),
      nom: asNullableString(json['nom']),
    );
  }

  Map<String, dynamic> toJson() => {
    'prenom': prenom,
    'nom': nom,
  };
}


