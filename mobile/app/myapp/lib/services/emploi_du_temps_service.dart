import '../models/emploi_du_temps_model.dart';
import 'api_service.dart';

// ─── EmploiDuTempsService ──────────────────────────────────────────────────────
class EmploiDuTempsService {
  EmploiDuTempsService._();
  static final EmploiDuTempsService instance = EmploiDuTempsService._();

  // Get emploi for classe
  Future<List<EmploiDuTempsModel>> getClasseEmploi(String classeId) async {
    return ApiService.instance.getList(
      '/emploi/classe/$classeId',
      EmploiDuTempsModel.fromJson,
    );
  }

  // Get all emploi
  Future<List<EmploiDuTempsModel>> getAllEmploi() async {
    return ApiService.instance.getList(
      '/emploi/getAll',
      EmploiDuTempsModel.fromJson,
    );
  }

  // Create emploi slot
  Future<void> createEmploi(Map<String, dynamic> data) async {
    await ApiService.instance.post(
      '/emploi/create',
      data,
      (json) => json,
    );
  }
}

