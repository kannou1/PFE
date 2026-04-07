// ─── UserModel ──────────────────────────────────────────────────────────────────
// Full model matching backend userSchema.js.
// Supports all fields + role-based parsing.
//
// Note: Optional fields are String?, DateTime?, List<String> for refs (populate later).

class UserModel {
  final String id;
  final String prenom;
  final String nom;
  final String sexe;
  final String email;
  final String role; // 'admin' | 'enseignant' | 'etudiant'
  final String? imageUser;
  final bool verified;
  final bool status;

  // Etudiant fields
  final String? numTel;
  final String? adresse;
  final DateTime? dateDeNaissance;
  final String? classeId;
  final DateTime? dateInscription;

  // Enseignant fields
  final String? specialite;
  final DateTime? dateEmbauche;
  final String? numTelEnseignant;
  final List<String> classes;

  // Admin field
  final String? adminCode;

  const UserModel({
    required this.id,
    required this.prenom,
    required this.nom,
    required this.sexe,
    required this.email,
    required this.role,
    this.imageUser,
    this.verified = false,
    this.status = false,
    this.numTel,
    this.adresse,
    this.dateDeNaissance,
    this.classeId,
    this.dateInscription,
    this.specialite,
    this.dateEmbauche,
    this.numTelEnseignant,
    this.classes = const [],
    this.adminCode,
  });

  // ── Deserialization ───────────────────────────────────────────────────────────
  factory UserModel.fromJson(Map<String, dynamic> json) {
    final id = json['_id'] ?? json['id'] ?? '';
    final role = json['role'] ?? 'etudiant';

    return UserModel(
      id: id as String? ?? '',
      prenom: json['prenom'] as String? ?? '',
      nom: json['nom'] as String? ?? '',
      sexe: json['sexe'] as String? ?? 'Unknown',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'etudiant',
      imageUser: json['image_User'],
      verified: json['verified'] as bool? ?? false,
      status: json['Status'] as bool? ?? false,

      // Role-based fields
      numTel: _parseString(json['NumTel']),
      adresse: _parseString(json['Adresse']),
      dateDeNaissance: _parseDate(json['datedeNaissance']),
      classeId: _parseString(json['classe']),
      dateInscription: _parseDate(json['dateInscription']),

      specialite: _parseString(json['specialite']),
      dateEmbauche: _parseDate(json['dateEmbauche']),
      numTelEnseignant: _parseString(json['NumTelEnseignant']),
      classes: _parseStringList(json['classes']),
      adminCode: _parseString(json['adminCode']),
    );
  }

  // ── Serialization ─────────────────────────────────────────────────────────────
  Map<String, dynamic> toJson() => {
    '_id': id,
    'prenom': prenom,
    'nom': nom,
    'sexe': sexe,
    'email': email,
    'role': role,
    if (imageUser != null) 'image_User': imageUser,
    'verified': verified,
    'Status': status,
    if (numTel != null) 'NumTel': numTel,
    if (adresse != null) 'Adresse': adresse,
    if (dateDeNaissance != null) 'datedeNaissance': dateDeNaissance!.toIso8601String(),
    if (classeId != null) 'classe': classeId,
    if (dateInscription != null) 'dateInscription': dateInscription!.toIso8601String(),
    if (specialite != null) 'specialite': specialite,
    if (dateEmbauche != null) 'dateEmbauche': dateEmbauche!.toIso8601String(),
    if (numTelEnseignant != null) 'NumTelEnseignant': numTelEnseignant,
    if (classes.isNotEmpty) 'classes': classes,
    if (adminCode != null) 'adminCode': adminCode,
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  String get fullName => '$prenom $nom'.trim();

  String get initials {
    final p = prenom.isNotEmpty ? prenom[0].toUpperCase() : '';
    final n = nom.isNotEmpty ? nom[0].toUpperCase() : '';
    return '$p$n';
  }

  bool get isAdmin => role == 'admin';
  bool get isTeacher => role == 'enseignant';
  bool get isStudent => role == 'etudiant';

  @override
  String toString() => 'UserModel(id: $id, $fullName ($role), status: $status)';

  // ── Private helpers ───────────────────────────────────────────────────────────
  static String? _parseString(dynamic v) => v is String && v.isNotEmpty ? v : null;
  static DateTime? _parseDate(dynamic v) => v is String ? DateTime.tryParse(v) : null;
  static List<String> _parseStringList(dynamic v) {
    if (v == null) return [];
    if (v is List) return v.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
    return [];
  }
}

