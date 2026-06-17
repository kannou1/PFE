import 'api_service.dart';
import '../models/examen_model.dart';


// ─── ExamenService ──────────────────────────────────────────────────────────────
class ExamenService {
  ExamenService._();
  static final ExamenService instance = ExamenService._();

  // Create examen
  Future<void> createExamen(Map<String, dynamic> data) async {
    await ApiService.instance.post(
      '/examen/create',
      data,
      (json) => json,
    );
  }

  // Get all examens
  Future<List<ExamenModel>> getAllExamens() async {
    return ApiService.instance.getList(
      '/examen/getAll',
      (json) => ExamenModel.fromJson(json),
    );
  }


  // Get by ID
  Future<dynamic> getExamenById(String id) async {
    return ApiService.instance.get(
      '/examen/getById/$id',
      (json) => json,
    );
  }

  // Update examen
  Future<void> updateExamen(String id, Map<String, dynamic> data) async {
    await ApiService.instance.put(
      '/examen/update/$id',
      data,
      (json) => json,
    );
  }

  // Delete examen
  Future<void> deleteExamen(String id) async {
    await ApiService.instance.delete('/examen/delete/$id');
  }

  // Submit assignment
  Future<void> submitAssignment(String examenId, Map<String, dynamic> data) async {
    await ApiService.instance.post(
      '/examen/submitAssignment/$examenId',
      data,
      (json) => json,
    );
  }
}

