import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../models/person_data.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../widgets/poster_card.dart';
import '../widgets/skeleton_loader.dart';

class PersonDetailScreen extends StatefulWidget {
  final int personId;

  const PersonDetailScreen({super.key, required this.personId});

  @override
  State<PersonDetailScreen> createState() => _PersonDetailScreenState();
}

class _PersonDetailScreenState extends State<PersonDetailScreen> {
  final ApiService _apiService = ApiService();

  PersonResponse? _personResponse;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPerson();
  }

  Future<void> _loadPerson() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await _apiService.getPerson(widget.personId);
      setState(() {
        _personResponse = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load profile.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(),
        body: SkeletonLoader.detailSkeleton(),
      );
    }

    if (_error != null || _personResponse == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error ?? 'Error', style: const TextStyle(color: AppColors.textDark)),
              ElevatedButton(onPressed: _loadPerson, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    final p = _personResponse!.person;
    final topWork = _personResponse!.topWork;

    return Scaffold(
      appBar: AppBar(title: Text(p.name)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: SizedBox(
                    width: 100,
                    height: 140,
                    child: p.profileUrl != null
                        ? CachedNetworkImage(imageUrl: p.profileUrl!, fit: BoxFit.cover)
                        : Container(color: AppColors.surface),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.name,
                          style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textLight)),
                      if (p.knownForDepartment != null)
                        Chip(label: Text(p.knownForDepartment!)),
                      if (p.placeOfBirth != null)
                        Text(p.placeOfBirth!,
                            style: const TextStyle(color: AppColors.textDark)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            if (p.biography != null && p.biography!.isNotEmpty) ...[
              const Text('Biography',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textLight)),
              const SizedBox(height: 8),
              Text(p.biography!,
                  maxLines: 6,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.textDark)),
              const SizedBox(height: 20),
            ],
            if (topWork.isNotEmpty) ...[
              const Text('Known For',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textLight)),
              const SizedBox(height: 12),
              SizedBox(
                height: 260,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: topWork.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final item = topWork[index];
                    return PosterCard(
                      id: item.id,
                      title: item.title,
                      year: item.year?.toString(),
                      mediaType: item.mediaType,
                      posterUrl: item.posterUrl,
                      width: 120,
                      onTap: () => context.push('/${item.mediaType}/${item.id}'),
                    );
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
