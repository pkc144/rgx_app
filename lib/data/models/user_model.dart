class UserModel {
  final String? id;
  final String? email;
  final String? name;
  final String? phone;
  final String? profileImage;
  final String? advisorCode;
  final String? advisorName;
  final bool? isVerified;
  final bool? isActive;
  final String? panNumber;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final UserSettings? settings;
  final List<BrokerConnection>? brokerConnections;

  UserModel({
    this.id,
    this.email,
    this.name,
    this.phone,
    this.profileImage,
    this.advisorCode,
    this.advisorName,
    this.isVerified,
    this.isActive,
    this.panNumber,
    this.createdAt,
    this.updatedAt,
    this.settings,
    this.brokerConnections,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String?,
      email: json['email'] as String?,
      name: json['name'] as String?,
      phone: json['phone'] as String?,
      profileImage: json['profileImage'] as String?,
      advisorCode: json['advisorCode'] as String?,
      advisorName: json['advisorName'] as String?,
      isVerified: json['isVerified'] as bool?,
      isActive: json['isActive'] as bool?,
      panNumber: json['panNumber'] as String?,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      settings: json['settings'] != null ? UserSettings.fromJson(json['settings']) : null,
      brokerConnections: (json['brokerConnections'] as List<dynamic>?)
          ?.map((e) => BrokerConnection.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'phone': phone,
      'profileImage': profileImage,
      'advisorCode': advisorCode,
      'advisorName': advisorName,
      'isVerified': isVerified,
      'isActive': isActive,
      'panNumber': panNumber,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'settings': settings?.toJson(),
      'brokerConnections': brokerConnections?.map((e) => e.toJson()).toList(),
    };
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? name,
    String? phone,
    String? profileImage,
    String? advisorCode,
    String? advisorName,
    bool? isVerified,
    bool? isActive,
    String? panNumber,
    DateTime? createdAt,
    DateTime? updatedAt,
    UserSettings? settings,
    List<BrokerConnection>? brokerConnections,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      profileImage: profileImage ?? this.profileImage,
      advisorCode: advisorCode ?? this.advisorCode,
      advisorName: advisorName ?? this.advisorName,
      isVerified: isVerified ?? this.isVerified,
      isActive: isActive ?? this.isActive,
      panNumber: panNumber ?? this.panNumber,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      settings: settings ?? this.settings,
      brokerConnections: brokerConnections ?? this.brokerConnections,
    );
  }

  bool get hasCompletedProfile {
    return name != null &&
        name!.isNotEmpty &&
        phone != null &&
        phone!.isNotEmpty;
  }

  bool get hasBrokerConnected {
    return brokerConnections != null &&
        brokerConnections!.any((b) => b.isActive == true);
  }
}

class UserSettings {
  final bool? pushNotifications;
  final bool? emailNotifications;
  final bool? whatsappNotifications;
  final bool? autoExecuteTrades;
  final String? preferredBroker;

  UserSettings({
    this.pushNotifications,
    this.emailNotifications,
    this.whatsappNotifications,
    this.autoExecuteTrades,
    this.preferredBroker,
  });

  factory UserSettings.fromJson(Map<String, dynamic> json) {
    return UserSettings(
      pushNotifications: json['pushNotifications'] as bool?,
      emailNotifications: json['emailNotifications'] as bool?,
      whatsappNotifications: json['whatsappNotifications'] as bool?,
      autoExecuteTrades: json['autoExecuteTrades'] as bool?,
      preferredBroker: json['preferredBroker'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'pushNotifications': pushNotifications,
      'emailNotifications': emailNotifications,
      'whatsappNotifications': whatsappNotifications,
      'autoExecuteTrades': autoExecuteTrades,
      'preferredBroker': preferredBroker,
    };
  }
}

class BrokerConnection {
  final String? id;
  final String? brokerCode;
  final String? brokerName;
  final String? clientId;
  final bool? isActive;
  final DateTime? connectedAt;
  final DateTime? expiresAt;

  BrokerConnection({
    this.id,
    this.brokerCode,
    this.brokerName,
    this.clientId,
    this.isActive,
    this.connectedAt,
    this.expiresAt,
  });

  factory BrokerConnection.fromJson(Map<String, dynamic> json) {
    return BrokerConnection(
      id: json['id'] as String?,
      brokerCode: json['brokerCode'] as String?,
      brokerName: json['brokerName'] as String?,
      clientId: json['clientId'] as String?,
      isActive: json['isActive'] as bool?,
      connectedAt: json['connectedAt'] != null ? DateTime.parse(json['connectedAt']) : null,
      expiresAt: json['expiresAt'] != null ? DateTime.parse(json['expiresAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'brokerCode': brokerCode,
      'brokerName': brokerName,
      'clientId': clientId,
      'isActive': isActive,
      'connectedAt': connectedAt?.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
    };
  }

  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }
}
