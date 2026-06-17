// ─── CoursModel ─────────────────────────────────────────────────────────────────
// Matches backend coursSchema.js

class CoursModel {
  final String id;
  final String nom;
  final String code;
  final String? description;
  final int credits;
  final String semestre;
  final String? classeId;
  final String? classeNom;
  final String? enseignantId;
  final String? enseignantNom;


  const CoursModel({
    required this.id,
    required this.nom,
    required this.code,
    this.description,
    required this.credits,
    required this.semestre,
    this.classeId,
    this.classeNom,
    this.enseignantId,
    this.enseignantNom,
  });


  factory CoursModel.fromJson(Map<String, dynamic> json) {
    return CoursModel(
      id: json['_id'] ?? json['id'] ?? '',
      nom: json['nom'] as String,
      code: json['code'] as String,
      description: json['description'],
      credits: json['credits'] as int,
      semestre: json['semestre'] as String,
      classeId: _parseString(json['classe']),
      classeNom: json['classe'] != null && json['classe'] is Map<String, dynamic>
          ? (json['classe']['nom'] as String?)
          : null,
      enseignantId: _parseString(json['enseignant']),
      enseignantNom: json['enseignant'] != null && json['enseignant'] is Map<String, dynamic>
          ? ((json['enseignant']['prenom'] ?? '') as String?)
          : null,

    );
  }

  Map<String, dynamic> toJson() => {
    '_id': id,
    'nom': nom,
    'code': code,
    if (description != null) 'description': description,
    'credits': credits,
    'semestre': semestre,
    if (classeId != null) 'classe': classeId,
    if (enseignantId != null) 'enseignant': enseignantId,
  };

  static String? _parseString(dynamic v) => v is String && v.isNotEmpty ? v : null;

  @override
  String toString() => 'CoursModel(id: $id, $nom ($code), $credits credits)';
}

