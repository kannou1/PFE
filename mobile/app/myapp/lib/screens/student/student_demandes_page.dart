import 'dart:async';

import 'package:flutter/material.dart';

import '../../models/demande_model.dart';
import '../../services/demande_service.dart';

/// Mobile version of the React StudentDemandes page.
///
/// Change the two import paths above if this file is stored in another folder.
class StudentDemandesPage extends StatefulWidget {
  /// Optional because some backends read the student from the JWT token.
  /// Pass the connected student's id only when your create endpoint requires it.
  final String? studentId;

  const StudentDemandesPage({
    super.key,
    this.studentId,
  });

  @override
  State<StudentDemandesPage> createState() => _StudentDemandesPageState();
}

class _StudentDemandesPageState extends State<StudentDemandesPage>
    with WidgetsBindingObserver {
  static const Color _primary = Color(0xFF6C4DF6);
  static const Color _secondary = Color(0xFF8B5CF6);
  static const Color _background = Color(0xFFF7F7FC);
  static const Color _textPrimary = Color(0xFF17172A);
  static const Color _textSecondary = Color(0xFF73738A);

  final DemandeService _demandeService = DemandeService.instance;

  final List<DemandeModel> _demandes = <DemandeModel>[];

  Timer? _refreshTimer;
  bool _loading = true;
  bool _refreshing = false;
  bool _processing = false;
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadDemandes();

    // Same behavior as the React page: refresh every 10 seconds.
    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (mounted && !_processing && !_refreshing) {
        _loadDemandes(showLoader: false, silent: true);
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Equivalent to refreshing the React page when the browser receives focus.
    if (state == AppLifecycleState.resumed) {
      _loadDemandes(showLoader: false, silent: true);
    }
  }

  Future<void> _loadDemandes({
    bool showLoader = true,
    bool silent = false,
  }) async {
    if (_refreshing) return;

    if (mounted) {
      setState(() {
        _refreshing = true;
        if (showLoader) _loading = true;
      });
    }

    try {
      final List<DemandeModel> result =
          await _demandeService.getMyDemandes();

      result.sort((a, b) => b.createdAt.compareTo(a.createdAt));

      if (!mounted) return;
      setState(() {
        _demandes
          ..clear()
          ..addAll(result);
      });
    } catch (error) {
      if (!silent && mounted) {
        _showMessage(
          _readableError(error, fallback: 'Failed to load your requests.'),
          success: false,
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          _refreshing = false;
        });
      }
    }
  }

  Future<void> _openCreateSheet() async {
    final bool? created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return _CreateDemandeSheet(
          primaryColor: _primary,
          studentId: widget.studentId,
          onCreate: _createDemande,
        );
      },
    );

    if (created == true && mounted) {
      _showMessage('Request created successfully!');
      await _loadDemandes(showLoader: false);
    }
  }

  Future<void> _createDemande({
    required String title,
    required String type,
    required String description,
    String? studentId,
  }) async {
    final Map<String, dynamic> payload = <String, dynamic>{
      'titre': title.trim(),
      'description': description.trim(),
      'type': type,
      'status': 'pending',
      if (studentId != null && studentId.trim().isNotEmpty)
        'etudiant': studentId.trim(),
    };

    await _demandeService.createDemande(payload);
  }

  Future<void> _confirmDelete(DemandeModel demande) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          title: const Row(
            children: <Widget>[
              Icon(Icons.warning_amber_rounded, color: Colors.red),
              SizedBox(width: 10),
              Expanded(child: Text('Delete Request')),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Text(
                'Are you sure you want to delete this request? This action cannot be undone.',
              ),
              const SizedBox(height: 16),
              _InfoBox(
                icon: Icons.description_outlined,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      demande.titre,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: _textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Type: ${_typeLabel(demande.type)}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: _textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel'),
            ),
            FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: Colors.red),
              onPressed: () => Navigator.pop(dialogContext, true),
              icon: const Icon(Icons.delete_outline_rounded),
              label: const Text('Delete Request'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    setState(() => _processing = true);
    try {
      await _demandeService.deleteDemande(demande.id);
      if (!mounted) return;
      setState(() => _demandes.removeWhere((item) => item.id == demande.id));
      _showMessage('Request deleted successfully!');
    } catch (error) {
      if (mounted) {
        _showMessage(
          _readableError(error, fallback: 'Failed to delete request.'),
          success: false,
        );
      }
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<void> _confirmDeleteAll() async {
    if (_demandes.isEmpty) return;

    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          title: const Row(
            children: <Widget>[
              Icon(Icons.warning_amber_rounded, color: Colors.red),
              SizedBox(width: 10),
              Expanded(child: Text('Delete ALL Requests')),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Text(
                'This will permanently delete all your requests. This action cannot be undone.',
              ),
              const SizedBox(height: 16),
              _InfoBox(
                icon: Icons.delete_sweep_outlined,
                child: Text(
                  'Total: ${_demandes.length} request${_demandes.length == 1 ? '' : 's'}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: _textPrimary,
                  ),
                ),
              ),
            ],
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel'),
            ),
            FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: Colors.red),
              onPressed: () => Navigator.pop(dialogContext, true),
              icon: const Icon(Icons.delete_sweep_outlined),
              label: const Text('Delete All'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    setState(() => _processing = true);

    int deletedCount = 0;
    try {
      // Your current DemandeService has no delete-all endpoint, so the page
      // reuses deleteDemande() for every request.
      for (final DemandeModel demande in List<DemandeModel>.from(_demandes)) {
        await _demandeService.deleteDemande(demande.id);
        deletedCount++;
      }

      if (!mounted) return;
      setState(_demandes.clear);
      _showMessage('All requests deleted successfully!');
    } catch (error) {
      if (!mounted) return;
      await _loadDemandes(showLoader: false, silent: true);
      _showMessage(
        'Deleted $deletedCount request(s), but the operation could not be completed.',
        success: false,
      );
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  void _showDetails(DemandeModel demande) {
    showDialog<void>(
      context: context,
      builder: (BuildContext dialogContext) {
        final _StatusVisual visual = _statusVisual(demande.status);

        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          title: const Text('Request Details'),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text(
                    'Information about your request',
                    style: TextStyle(color: _textSecondary),
                  ),
                  const SizedBox(height: 20),
                  _DetailItem(label: 'Request Name', value: demande.titre),
                  const SizedBox(height: 14),
                  _DetailItem(label: 'Type', value: _typeLabel(demande.type)),
                  const SizedBox(height: 14),
                  const Text(
                    'Status',
                    style: TextStyle(
                      fontSize: 12,
                      color: _textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  _StatusBadge(visual: visual),
                  const SizedBox(height: 14),
                  _DetailItem(
                    label: 'Submitted',
                    value: _formatDateTime(demande.createdAt),
                  ),
                  if (demande.description.trim().isNotEmpty) ...<Widget>[
                    const SizedBox(height: 18),
                    const Text(
                      'Description',
                      style: TextStyle(
                        fontSize: 12,
                        color: _textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF2F2F7),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Text(demande.description),
                    ),
                  ],
                  if (demande.response?.trim().isNotEmpty ?? false) ...<Widget>[
                    const SizedBox(height: 18),
                    const Text(
                      'Administration Response',
                      style: TextStyle(
                        fontSize: 12,
                        color: _textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF2F2F7),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Text(demande.response!.trim()),
                    ),
                  ],
                  const SizedBox(height: 18),
                  _StatusAlert(status: _normalizeStatus(demande.status)),
                ],
              ),
            ),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  List<DemandeModel> get _filteredDemandes {
    if (_filterStatus == 'all') return List<DemandeModel>.from(_demandes);

    return _demandes
        .where(
          (DemandeModel demande) =>
              _normalizeStatus(demande.status) == _filterStatus,
        )
        .toList();
  }

  int _countStatus(String status) {
    return _demandes
        .where((DemandeModel item) => _normalizeStatus(item.status) == status)
        .length;
  }

  void _showMessage(String message, {bool success = true}) {
    if (!mounted) return;

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          backgroundColor:
              success ? const Color(0xFF148A50) : const Color(0xFFBE3030),
          content: Row(
            children: <Widget>[
              Icon(
                success
                    ? Icons.check_circle_outline_rounded
                    : Icons.error_outline_rounded,
                color: Colors.white,
              ),
              const SizedBox(width: 10),
              Expanded(child: Text(message)),
            ],
          ),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    final List<DemandeModel> filtered = _filteredDemandes;

    return Scaffold(
      backgroundColor: _background,
      body: Stack(
        children: <Widget>[
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: <Color>[
                  Color(0xFFFFFFFF),
                  Color(0xFFF8F7FF),
                  Color(0xFFF2EEFF),
                ],
              ),
            ),
          ),
          SafeArea(
            child: RefreshIndicator(
              color: _primary,
              onRefresh: () => _loadDemandes(showLoader: false),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 32),
                children: <Widget>[
                  _buildHeader(),
                  const SizedBox(height: 22),
                  _buildStatistics(),
                  const SizedBox(height: 22),
                  if (_loading)
                    const _LoadingView()
                  else if (filtered.isEmpty)
                    _EmptyState(
                      filterStatus: _filterStatus,
                      onCreate: _openCreateSheet,
                    )
                  else
                    ...filtered.map(
                      (DemandeModel demande) => Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: _DemandeCard(
                          demande: demande,
                          visual: _statusVisual(demande.status),
                          typeLabel: _typeLabel(demande.type),
                          formattedDate: _formatDate(demande.createdAt),
                          onView: () => _showDetails(demande),
                          onDelete: () => _confirmDelete(demande),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (_processing)
            Positioned.fill(
              child: ColoredBox(
                color: Colors.black26,
                child: const Center(
                  child: Card(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: CircularProgressIndicator(color: _primary),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        ShaderMask(
          blendMode: BlendMode.srcIn,
          shaderCallback: (Rect bounds) => const LinearGradient(
            colors: <Color>[_primary, _secondary],
          ).createShader(bounds),
          child: const Text(
            'My Requests',
            style: TextStyle(
              fontSize: 31,
              height: 1.1,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        const SizedBox(height: 7),
        const Text(
          'View and manage your document requests',
          style: TextStyle(
            fontSize: 14,
            color: _textSecondary,
          ),
        ),
        const SizedBox(height: 18),
        Row(
          children: <Widget>[
            if (_demandes.isNotEmpty) ...<Widget>[
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Color(0xFFE9A6A6)),
                    minimumSize: const Size.fromHeight(50),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  onPressed: _processing ? null : _confirmDeleteAll,
                  icon: const Icon(Icons.delete_sweep_outlined),
                  label: const Text('Delete All'),
                ),
              ),
              const SizedBox(width: 10),
            ],
            Expanded(
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: _primary,
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed: _processing ? null : _openCreateSheet,
                icon: const Icon(Icons.add_rounded),
                label: const Text('New Request'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatistics() {
    final List<_StatData> stats = <_StatData>[
      _StatData(
        keyName: 'all',
        label: 'Total Requests',
        value: _demandes.length,
        icon: Icons.description_outlined,
        color: _primary,
      ),
      _StatData(
        keyName: 'pending',
        label: 'Pending',
        value: _countStatus('pending'),
        icon: Icons.schedule_rounded,
        color: const Color(0xFFE59A18),
      ),
      _StatData(
        keyName: 'approved',
        label: 'Approved',
        value: _countStatus('approved'),
        icon: Icons.check_circle_outline_rounded,
        color: const Color(0xFF15945B),
      ),
      _StatData(
        keyName: 'rejected',
        label: 'Rejected',
        value: _countStatus('rejected'),
        icon: Icons.cancel_outlined,
        color: const Color(0xFFD94343),
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: stats.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.47,
      ),
      itemBuilder: (BuildContext context, int index) {
        final _StatData stat = stats[index];
        return _StatCard(
          data: stat,
          selected: _filterStatus == stat.keyName,
          onTap: () => setState(() => _filterStatus = stat.keyName),
        );
      },
    );
  }
}

class _DemandeCard extends StatelessWidget {
  final DemandeModel demande;
  final _StatusVisual visual;
  final String typeLabel;
  final String formattedDate;
  final VoidCallback onView;
  final VoidCallback onDelete;

  const _DemandeCard({
    required this.demande,
    required this.visual,
    required this.typeLabel,
    required this.formattedDate,
    required this.onView,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withOpacity(0.08),
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: <Widget>[
          Container(
            height: 6,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: visual.gradientColors),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: visual.gradientColors,
                        ),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: Icon(visual.icon, color: Colors.white, size: 26),
                    ),
                    const SizedBox(width: 13),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            demande.titre,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 17,
                              height: 1.2,
                              color: _StudentDemandesPageState._textPrimary,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 7),
                          _StatusBadge(visual: visual),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: 'Delete',
                      onPressed: onDelete,
                      icon: const Icon(
                        Icons.delete_outline_rounded,
                        color: Color(0xFFD94343),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  'Type: $typeLabel',
                  style: const TextStyle(
                    fontSize: 14,
                    color: _StudentDemandesPageState._textSecondary,
                  ),
                ),
                const SizedBox(height: 9),
                Row(
                  children: <Widget>[
                    const Icon(
                      Icons.calendar_today_outlined,
                      size: 15,
                      color: _StudentDemandesPageState._textSecondary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Submitted: $formattedDate',
                      style: const TextStyle(
                        fontSize: 12,
                        color: _StudentDemandesPageState._textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 15),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _StudentDemandesPageState._primary,
                      minimumSize: const Size.fromHeight(45),
                      side: const BorderSide(color: Color(0xFFD8D0FF)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(13),
                      ),
                    ),
                    onPressed: onView,
                    child: const Text('View Details'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CreateDemandeSheet extends StatefulWidget {
  final Color primaryColor;
  final String? studentId;
  final Future<void> Function({
    required String title,
    required String type,
    required String description,
    String? studentId,
  }) onCreate;

  const _CreateDemandeSheet({
    required this.primaryColor,
    required this.studentId,
    required this.onCreate,
  });

  @override
  State<_CreateDemandeSheet> createState() => _CreateDemandeSheetState();
}

class _CreateDemandeSheetState extends State<_CreateDemandeSheet> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  String? _selectedType;
  bool _submitting = false;
  String? _errorMessage;

  static const List<_DocumentType> _documentTypes = <_DocumentType>[
    _DocumentType(
      value: 'attestation_presence',
      label: 'Attendance Certificate',
      icon: Icons.description_outlined,
    ),
    _DocumentType(
      value: 'attestation_inscription',
      label: 'Registration Certificate',
      icon: Icons.description_outlined,
    ),
    _DocumentType(
      value: 'attestation_reussite',
      label: 'Success Certificate',
      icon: Icons.task_alt_rounded,
    ),
    _DocumentType(
      value: 'releve de notes',
      label: 'Transcript',
      icon: Icons.receipt_long_outlined,
    ),
    _DocumentType(
      value: 'stage',
      label: 'Internship',
      icon: Icons.work_outline_rounded,
    ),
    _DocumentType(
      value: 'autre',
      label: 'Other',
      icon: Icons.more_horiz_rounded,
    ),
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      await widget.onCreate(
        title: _titleController.text,
        type: _selectedType!,
        description: _descriptionController.text,
        studentId: widget.studentId,
      );

      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = _readableError(
          error,
          fallback: 'Failed to create request.',
        );
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final double bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, 12, 20, 24 + bottomInset),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Center(
                child: Container(
                  width: 46,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD9D9E2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Create New Request',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: _StudentDemandesPageState._textPrimary,
                ),
              ),
              const SizedBox(height: 5),
              const Text(
                'Submit a new document request to the administration',
                style: TextStyle(
                  color: _StudentDemandesPageState._textSecondary,
                ),
              ),
              const SizedBox(height: 24),
              const _FieldLabel(label: 'Request Name', requiredField: true),
              const SizedBox(height: 8),
              TextFormField(
                controller: _titleController,
                textInputAction: TextInputAction.next,
                decoration: _inputDecoration(
                  hint: 'e.g., Attendance Certificate 2026',
                  icon: Icons.edit_note_rounded,
                ),
                validator: (String? value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a request name.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 7),
              const Text(
                'Give your request a clear, descriptive name',
                style: TextStyle(
                  fontSize: 12,
                  color: _StudentDemandesPageState._textSecondary,
                ),
              ),
              const SizedBox(height: 19),
              const _FieldLabel(label: 'Document Type', requiredField: true),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedType,
                isExpanded: true,
                decoration: _inputDecoration(
                  hint: 'Select document type',
                  icon: Icons.description_outlined,
                ),
                items: _documentTypes
                    .map(
                      (_DocumentType type) => DropdownMenuItem<String>(
                        value: type.value,
                        child: Row(
                          children: <Widget>[
                            Icon(type.icon, size: 19),
                            const SizedBox(width: 9),
                            Expanded(child: Text(type.label)),
                          ],
                        ),
                      ),
                    )
                    .toList(),
                onChanged: _submitting
                    ? null
                    : (String? value) =>
                        setState(() => _selectedType = value),
                validator: (String? value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select a document type.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 7),
              const Text(
                'Choose the type of document you need',
                style: TextStyle(
                  fontSize: 12,
                  color: _StudentDemandesPageState._textSecondary,
                ),
              ),
              const SizedBox(height: 19),
              const _FieldLabel(label: 'Description (Optional)'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descriptionController,
                minLines: 4,
                maxLines: 6,
                textCapitalization: TextCapitalization.sentences,
                decoration: _inputDecoration(
                  hint: 'Add additional details or special requirements...',
                  icon: Icons.notes_rounded,
                  alignLabelWithHint: true,
                ),
              ),
              if (_errorMessage != null) ...<Widget>[
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(13),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFEEEE),
                    border: Border.all(color: const Color(0xFFF1B0B0)),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: Row(
                    children: <Widget>[
                      const Icon(Icons.error_outline, color: Colors.red),
                      const SizedBox(width: 9),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Color(0xFF8F2424)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              Row(
                children: <Widget>[
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed:
                          _submitting ? null : () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 11),
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: widget.primaryColor,
                        minimumSize: const Size.fromHeight(50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: _submitting ? null : _submit,
                      icon: _submitting
                          ? const SizedBox(
                              width: 19,
                              height: 19,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.add_rounded),
                      label: Text(
                        _submitting ? 'Creating...' : 'Create Request',
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required IconData icon,
    bool alignLabelWithHint = false,
  }) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon),
      alignLabelWithHint: alignLabelWithHint,
      filled: true,
      fillColor: const Color(0xFFFAFAFD),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFE2E2EA)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFE2E2EA)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: widget.primaryColor, width: 1.5),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final _StatData data;
  final bool selected;
  final VoidCallback onTap;

  const _StatCard({
    required this.data,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: selected ? 4 : 1,
      shadowColor: data.color.withOpacity(0.18),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected ? data.color : const Color(0xFFEAEAF1),
              width: selected ? 1.7 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: <Widget>[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Expanded(
                    child: Text(
                      data.label,
                      maxLines: 2,
                      style: const TextStyle(
                        fontSize: 12.5,
                        height: 1.15,
                        color: _StudentDemandesPageState._textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Icon(data.icon, color: data.color, size: 27),
                ],
              ),
              Text(
                data.value.toString(),
                style: TextStyle(
                  fontSize: 27,
                  height: 1,
                  color: data.color,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final _StatusVisual visual;

  const _StatusBadge({required this.visual});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: visual.backgroundColor,
        borderRadius: BorderRadius.circular(50),
        border: Border.all(color: visual.borderColor),
      ),
      child: Text(
        visual.label,
        style: TextStyle(
          fontSize: 11.5,
          color: visual.foregroundColor,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _StatusAlert extends StatelessWidget {
  final String status;

  const _StatusAlert({required this.status});

  @override
  Widget build(BuildContext context) {
    late final Color background;
    late final Color border;
    late final Color foreground;
    late final IconData icon;
    late final String message;

    switch (status) {
      case 'approved':
        background = const Color(0xFFEAF9F0);
        border = const Color(0xFFB8E4C9);
        foreground = const Color(0xFF176F45);
        icon = Icons.check_circle_outline_rounded;
        message =
            'Your request has been approved. You can collect your document from the administration office.';
        break;
      case 'rejected':
        background = const Color(0xFFFFEEEE);
        border = const Color(0xFFF3B9B9);
        foreground = const Color(0xFF972E2E);
        icon = Icons.cancel_outlined;
        message =
            'Your request has been rejected. Please contact the administration for more information.';
        break;
      default:
        background = const Color(0xFFFFF8E8);
        border = const Color(0xFFF2D79A);
        foreground = const Color(0xFF8A6117);
        icon = Icons.schedule_rounded;
        message = 'Your request is pending review by the administration.';
        break;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, size: 21, color: foreground),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 13,
                height: 1.35,
                color: foreground,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String filterStatus;
  final VoidCallback onCreate;

  const _EmptyState({
    required this.filterStatus,
    required this.onCreate,
  });

  @override
  Widget build(BuildContext context) {
    final bool all = filterStatus == 'all';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 54),
      child: Column(
        children: <Widget>[
          Container(
            width: 88,
            height: 88,
            decoration: const BoxDecoration(
              color: Color(0xFFEDE9FF),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.description_outlined,
              size: 45,
              color: _StudentDemandesPageState._primary,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            all ? 'No requests yet' : 'No $filterStatus requests',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 19,
              color: _StudentDemandesPageState._textSecondary,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (all) ...<Widget>[
            const SizedBox(height: 18),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: _StudentDemandesPageState._primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(13),
                ),
              ),
              onPressed: onCreate,
              icon: const Icon(Icons.add_rounded),
              label: const Text('Create Your First Request'),
            ),
          ],
        ],
      ),
    );
  }
}

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 64),
      child: Column(
        children: <Widget>[
          CircularProgressIndicator(
            color: _StudentDemandesPageState._primary,
          ),
          SizedBox(height: 16),
          Text(
            'Loading requests...',
            style: TextStyle(
              color: _StudentDemandesPageState._textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoBox extends StatelessWidget {
  final IconData icon;
  final Widget child;

  const _InfoBox({required this.icon, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F9),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: const Color(0xFFE3E3EA)),
      ),
      child: Row(
        children: <Widget>[
          Icon(icon, size: 21, color: _StudentDemandesPageState._primary),
          const SizedBox(width: 10),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _DetailItem extends StatelessWidget {
  final String label;
  final String value;

  const _DetailItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: _StudentDemandesPageState._textSecondary,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            color: _StudentDemandesPageState._textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String label;
  final bool requiredField;

  const _FieldLabel({
    required this.label,
    this.requiredField = false,
  });

  @override
  Widget build(BuildContext context) {
    return Text.rich(
      TextSpan(
        text: label,
        children: <InlineSpan>[
          if (requiredField)
            const TextSpan(
              text: ' *',
              style: TextStyle(color: Colors.red),
            ),
        ],
      ),
      style: const TextStyle(
        fontSize: 13,
        color: _StudentDemandesPageState._textPrimary,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _StatData {
  final String keyName;
  final String label;
  final int value;
  final IconData icon;
  final Color color;

  const _StatData({
    required this.keyName,
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });
}

class _StatusVisual {
  final String label;
  final IconData icon;
  final List<Color> gradientColors;
  final Color backgroundColor;
  final Color foregroundColor;
  final Color borderColor;

  const _StatusVisual({
    required this.label,
    required this.icon,
    required this.gradientColors,
    required this.backgroundColor,
    required this.foregroundColor,
    required this.borderColor,
  });
}

class _DocumentType {
  final String value;
  final String label;
  final IconData icon;

  const _DocumentType({
    required this.value,
    required this.label,
    required this.icon,
  });
}

String _normalizeStatus(String status) {
  switch (status.trim().toLowerCase()) {
    case 'approved':
    case 'approuvee':
    case 'approuvé':
    case 'approuve':
      return 'approved';
    case 'rejected':
    case 'rejete':
    case 'rejetee':
    case 'rejeté':
    case 'rejetée':
      return 'rejected';
    case 'pending':
    case 'en_attente':
    case 'en attente':
    default:
      return 'pending';
  }
}

_StatusVisual _statusVisual(String status) {
  switch (_normalizeStatus(status)) {
    case 'approved':
      return const _StatusVisual(
        label: 'Approved',
        icon: Icons.check_circle_outline_rounded,
        gradientColors: <Color>[Color(0xFF22B573), Color(0xFF0D8E54)],
        backgroundColor: Color(0xFFEAF9F0),
        foregroundColor: Color(0xFF176F45),
        borderColor: Color(0xFFB8E4C9),
      );
    case 'rejected':
      return const _StatusVisual(
        label: 'Rejected',
        icon: Icons.cancel_outlined,
        gradientColors: <Color>[Color(0xFFEE5A5A), Color(0xFFC92F51)],
        backgroundColor: Color(0xFFFFEEEE),
        foregroundColor: Color(0xFF972E2E),
        borderColor: Color(0xFFF3B9B9),
      );
    default:
      return const _StatusVisual(
        label: 'Pending',
        icon: Icons.schedule_rounded,
        gradientColors: <Color>[Color(0xFFF4B740), Color(0xFFE48124)],
        backgroundColor: Color(0xFFFFF8E8),
        foregroundColor: Color(0xFF8A6117),
        borderColor: Color(0xFFF2D79A),
      );
  }
}

String _typeLabel(String type) {
  const Map<String, String> labels = <String, String>{
    'attestation_presence': 'Attendance Certificate',
    'attestation_inscription': 'Registration Certificate',
    'attestation_reussite': 'Success Certificate',
    'releve de notes': 'Transcript',
    'releve_de_notes': 'Transcript',
    'stage': 'Internship',
    'absence': 'Absence',
    'document': 'Document',
    'autre': 'Other',
  };

  return labels[type.trim().toLowerCase()] ?? type;
}

String _formatDate(DateTime date) {
  final DateTime local = date.toLocal();
  return '${_twoDigits(local.day)}/${_twoDigits(local.month)}/${local.year}';
}

String _formatDateTime(DateTime date) {
  final DateTime local = date.toLocal();
  return '${_formatDate(local)} at ${_twoDigits(local.hour)}:${_twoDigits(local.minute)}';
}

String _twoDigits(int value) => value.toString().padLeft(2, '0');

String _readableError(Object error, {required String fallback}) {
  final String message = error.toString().replaceFirst('Exception: ', '').trim();
  return message.isEmpty ? fallback : message;
}
