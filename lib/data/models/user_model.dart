import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
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

  factory UserModel.fromJson(Map<String, dynamic> json) => _$UserModelFromJson(json);
  Map<String, dynamic> toJson() => _$UserModelToJson(this);

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

@JsonSerializable()
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

  factory UserSettings.fromJson(Map<String, dynamic> json) => _$UserSettingsFromJson(json);
  Map<String, dynamic> toJson() => _$UserSettingsToJson(this);
}

@JsonSerializable()
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

  factory BrokerConnection.fromJson(Map<String, dynamic> json) => _$BrokerConnectionFromJson(json);
  Map<String, dynamic> toJson() => _$BrokerConnectionToJson(this);

  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }
}
