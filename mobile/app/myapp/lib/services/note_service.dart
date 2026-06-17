import '../models/note_model.dart';
import 'api_service.dart';

// ─── NoteService ────────────────────────────────────────────────────────────────
class NoteService {
  NoteService._();
  static final NoteService instance = NoteService._();

  // Get notes for current student (requires etudiant role)
  Future<List<NoteModel>> getStudentNotes() async {
    return ApiService.instance.getList(
      '/note/getForStudent',
      NoteModel.fromJson,
    );
  }


  // Get all notes (teacher)
  Future<List<NoteModel>> getAllNotes() async {
    return ApiService.instance.getList(
      '/note/get',
      NoteModel.fromJson,
    );
  }

  // Create/update note
  Future<NoteModel> saveNote(Map<String, dynamic> data) async {
    return ApiService.instance.post(
      '/note/create',
      data,
      NoteModel.fromJson,
    );
  }

  // Delete note
  Future<void> deleteNote(String id) async {
    await ApiService.instance.delete('/note/delete/$id');
  }
}

