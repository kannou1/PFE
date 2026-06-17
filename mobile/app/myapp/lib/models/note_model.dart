// ─── NoteModel ─────────────────────────────────────────────────────────────────
// Matches backend noteSchema (student grades)

class NoteModel {
  final String id;
  final double valeur;

  /// “Matiere” may not exist in backend; we keep a best-effort value.
  final String matiere;

  final String? appreciation;

  /// IDs are sometimes populated (object) instead of raw strings.
  final String etudiantId;
  final String examenId;
  final String enseignantId;

  const NoteModel({
    required this.id,
    required this.valeur,
    required this.matiere,
    this.appreciation,
    required this.etudiantId,
    required this.examenId,
    required this.enseignantId,
  });

  static String _idFrom(dynamic v) {
    if (v == null) return '';
    if (v is String) return v;
    if (v is Map<String, dynamic>) return (v['_id'] ?? v['id'] ?? '').toString();
    return v.toString();
  }

  static double _doubleFrom(dynamic v) {
    if (v == null) return 0.0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  /// Best-effort mapping.
  /// Backend might return:
  /// - matiere directly (string)
  /// - OR examen: { nom, ... }
  factory NoteModel.fromJson(Map<String, dynamic> json) {
    final examenVal = json['examen'];

    final String examenId = _idFrom(examenVal);
    final String etudiantId = _idFrom(json['etudiant']);
    final String enseignantId = _idFrom(json['enseignant']);

    final String matiere = (json['matiere'] ?? '').toString().trim().isNotEmpty
        ? (json['matiere'] ?? '').toString().trim()
        : (examenVal is Map<String, dynamic>
            ? (examenVal['nom'] ?? '').toString()
            : '').toString();

    // Backend may send either `valeur` or `score`.
    final rawGrade = json.containsKey('valeur') ? json['valeur'] : json['score'];

    return NoteModel(
      id: _idFrom(json['_id'] ?? json['id'] ?? ''),
      valeur: _doubleFrom(rawGrade),
      matiere: matiere,
      appreciation: json['appreciation']?.toString(),
      etudiantId: etudiantId,
      examenId: examenId,
      enseignantId: enseignantId,
    );
  }


  Map<String, dynamic> toJson() => {
        '_id': id,
        'valeur': valeur,
        'matiere': matiere,
        if (appreciation != null) 'appreciation': appreciation,
        'etudiant': etudiantId,
        'examen': examenId,
        'enseignant': enseignantId,
      };

  String get gradeLetter {
    if (valeur >= 16) return 'A';
    if (valeur >= 14) return 'B';
    if (valeur >= 12) return 'C';
    if (valeur >= 10) return 'D';
    return 'F';
  }

  @override
  String toString() =>
      'NoteModel(id: $id, $matiere: ${valeur.toStringAsFixed(2)} ($gradeLetter))';
}

