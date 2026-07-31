// Data models for the `/api/person/{id}` response.

class PersonData {
  final int id;
  final String name;
  final String? biography;
  final String? birthday;
  final String? placeOfBirth;
  final String? profileUrl;
  final String? knownForDepartment;

  PersonData({
    required this.id,
    required this.name,
    this.biography,
    this.birthday,
    this.placeOfBirth,
    this.profileUrl,
    this.knownForDepartment,
  });

  factory PersonData.fromJson(Map<String, dynamic> json) {
    return PersonData(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      biography: json['biography'],
      birthday: json['birthday'],
      placeOfBirth: json['place_of_birth'],
      profileUrl: json['profile_url'],
      knownForDepartment: json['known_for_department'],
    );
  }
}

class PersonCredit {
  final int id;
  final String mediaType; // movie | tv
  final String title;
  final int? year;
  final String role;
  final String roleBucket; // acting | directing | other
  final String? character;
  final String? job;
  final String? department;
  final double? popularity;
  final String? posterUrl;

  PersonCredit({
    required this.id,
    required this.mediaType,
    required this.title,
    this.year,
    required this.role,
    required this.roleBucket,
    this.character,
    this.job,
    this.department,
    this.popularity,
    this.posterUrl,
  });

  factory PersonCredit.fromJson(Map<String, dynamic> json) {
    return PersonCredit(
      id: json['id'] ?? 0,
      mediaType: json['media_type'] ?? 'movie',
      title: json['title'] ?? '',
      year: json['year'],
      role: json['role'] ?? '',
      roleBucket: json['role_bucket'] ?? 'other',
      character: json['character'],
      job: json['job'],
      department: json['department'],
      popularity: (json['popularity'] as num?)?.toDouble(),
      posterUrl: json['poster_url'],
    );
  }
}

class RoleDistribution {
  final int acting;
  final int directing;
  final int other;

  RoleDistribution({
    required this.acting,
    required this.directing,
    required this.other,
  });

  factory RoleDistribution.fromJson(Map<String, dynamic> json) {
    return RoleDistribution(
      acting: json['acting'] ?? 0,
      directing: json['directing'] ?? 0,
      other: json['other'] ?? 0,
    );
  }
}

class CareerSpan {
  final int? startYear;
  final int? endYear;
  final int? activeYears;

  CareerSpan({this.startYear, this.endYear, this.activeYears});

  factory CareerSpan.fromJson(Map<String, dynamic> json) {
    return CareerSpan(
      startYear: json['start_year'],
      endYear: json['end_year'],
      activeYears: json['active_years'],
    );
  }
}

class RelatedPerson {
  final int id;
  final String name;
  final String? knownFor;
  final String? profileUrl;
  final double? popularity;

  RelatedPerson({
    required this.id,
    required this.name,
    this.knownFor,
    this.profileUrl,
    this.popularity,
  });

  factory RelatedPerson.fromJson(Map<String, dynamic> json) {
    return RelatedPerson(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      knownFor: json['known_for'],
      profileUrl: json['profile_url'],
      popularity: (json['popularity'] as num?)?.toDouble(),
    );
  }
}

/// Full person response from `/api/person/{id}`.
class PersonResponse {
  final PersonData person;
  final List<PersonCredit> topWork;
  final List<PersonCredit> creditsAll;
  final List<PersonCredit> creditsActing;
  final List<PersonCredit> creditsDirecting;
  final List<PersonCredit> creditsOther;
  final RoleDistribution? roleDistribution;
  final CareerSpan? careerSpan;
  final List<String> knownForTags;
  final List<RelatedPerson> relatedPeople;
  final bool cached;

  PersonResponse({
    required this.person,
    required this.topWork,
    required this.creditsAll,
    required this.creditsActing,
    required this.creditsDirecting,
    required this.creditsOther,
    this.roleDistribution,
    this.careerSpan,
    required this.knownForTags,
    required this.relatedPeople,
    required this.cached,
  });

  factory PersonResponse.fromJson(Map<String, dynamic> json) {
    return PersonResponse(
      person: PersonData.fromJson(json['person'] as Map<String, dynamic>),
      topWork: (json['top_work'] as List?)
              ?.map((c) => PersonCredit.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      creditsAll: (json['credits_all'] as List?)
              ?.map((c) => PersonCredit.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      creditsActing: (json['credits_acting'] as List?)
              ?.map((c) => PersonCredit.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      creditsDirecting: (json['credits_directing'] as List?)
              ?.map((c) => PersonCredit.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      creditsOther: (json['credits_other'] as List?)
              ?.map((c) => PersonCredit.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      roleDistribution: json['role_distribution'] != null
          ? RoleDistribution.fromJson(
              json['role_distribution'] as Map<String, dynamic>)
          : null,
      careerSpan: json['career_span'] != null
          ? CareerSpan.fromJson(json['career_span'] as Map<String, dynamic>)
          : null,
      knownForTags: List<String>.from(json['known_for_tags'] ?? []),
      relatedPeople: (json['related_people'] as List?)
              ?.map(
                  (r) => RelatedPerson.fromJson(r as Map<String, dynamic>))
              .toList() ??
          [],
      cached: json['cached'] ?? false,
    );
  }
}
