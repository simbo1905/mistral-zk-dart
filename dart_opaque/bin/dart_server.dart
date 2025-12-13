#!/usr/bin/env dart
// Dart OPAQUE Server - compatible with opaque-ts client

import 'dart:io';
import 'dart:convert';
import 'package:dart_opaque/dart_opaque.dart';

final _users = <String, Map<String, dynamic>>{};

Future<void> main() async {
  final server = await HttpServer.bind('localhost', 3457);
  print('🚀 Dart OPAQUE Server running on http://${server.address.host}:${server.port}');
  
  await for (final request in server) {
    try {
      final response = request.response;
      
      // Enable CORS
      response.headers.add('Access-Control-Allow-Origin', '*');
      response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.add('Access-Control-Allow-Headers', 'Content-Type');
      
      // Handle OPTIONS (preflight)
      if (request.method == 'OPTIONS') {
        response.statusCode = HttpStatus.ok;
        await response.close();
        continue;
      }
      
      // Parse URL
      final path = request.uri.path;
      final username = request.uri.queryParameters['username'] ?? 'default';
      
      // Route requests
      if (path == '/health') {
        await _handleHealth(response);
      } else if (path == '/register/start' && request.method == 'POST') {
        await _handleRegisterStart(request, response, username);
      } else if (path == '/register/finish' && request.method == 'POST') {
        await _handleRegisterFinish(request, response, username);
      } else if (path == '/login/start' && request.method == 'POST') {
        await _handleLoginStart(request, response, username);
      } else if (path == '/login/finish' && request.method == 'POST') {
        await _handleLoginFinish(request, response, username);
      } else {
        response.statusCode = HttpStatus.notFound;
        response.write('Not Found');
        await response.close();
      }
    } catch (e) {
      print('❌ Error handling request: $e');
      final response = request.response;
      response.statusCode = HttpStatus.internalServerError;
      response.write('Internal Server Error: $e');
      await response.close();
    }
  }
}

Future<void> _handleHealth(HttpResponse response) async {
  response.statusCode = HttpStatus.ok;
  response.headers.contentType = ContentType.json;
  response.write(jsonEncode({
    'status': 'ok',
    'users': _users.keys.toList(),
    'serverIdentity': 'dart-opaque-server',
    'language': 'dart',
  }));
  await response.close();
}

Future<void> _handleRegisterStart(HttpRequest request, HttpResponse response, String username) async {
  // In real OPAQUE, this would start the registration protocol
  // For demo, we'll simulate it
  final body = await utf8.decodeStream(request);
  final data = jsonDecode(body) as Map<String, dynamic>;
  
  // Simulate registration start
  final tempRecord = {
    'username': username,
    'state': 'pending',
    'clientData': data,
  };
  
  response.statusCode = HttpStatus.ok;
  response.headers.contentType = ContentType.json;
  response.write(jsonEncode({
    'registrationResponse': 'simulated_response_data',
    'username': username,
  }));
  await response.close();
}

Future<void> _handleRegisterFinish(HttpRequest request, HttpResponse response, String username) async {
  final body = await utf8.decodeStream(request);
  final data = jsonDecode(body) as Map<String, dynamic>;
  
  // Extract password from client data (simplified)
  final password = data['password'] ?? 'default_password';
  
  // Register user with Dart OPAQUE
  final result = DartOpaque.register(password);
  
  // Store user record
  _users[username] = result['record'];
  
  response.statusCode = HttpStatus.ok;
  response.headers.contentType = ContentType.json;
  response.write(jsonEncode({
    'success': true,
    'username': username,
  }));
  await response.close();
}

Future<void> _handleLoginStart(HttpRequest request, HttpResponse response, String username) async {
  final body = await utf8.decodeStream(request);
  final data = jsonDecode(body) as Map<String, dynamic>;
  
  // Get user record
  final userRecord = _users[username];
  if (userRecord == null) {
    response.statusCode = HttpStatus.notFound;
    response.write(jsonEncode({'error': 'User not found'}));
    await response.close();
    return;
  }
  
  // Simulate login start
  response.statusCode = HttpStatus.ok;
  response.headers.contentType = ContentType.json;
  response.write(jsonEncode({
    'loginResponse': 'simulated_ke2_data',
    'username': username,
    'userRecord': userRecord, // Return record for client to use
  }));
  await response.close();
}

Future<void> _handleLoginFinish(HttpRequest request, HttpResponse response, String username) async {
  final body = await utf8.decodeStream(request);
  final data = jsonDecode(body) as Map<String, dynamic>;
  
  final password = data['password'] ?? 'default_password';
  final userRecord = _users[username];
  
  if (userRecord == null) {
    response.statusCode = HttpStatus.notFound;
    response.write(jsonEncode({'error': 'User not found'}));
    await response.close();
    return;
  }
  
  // Verify login with Dart OPAQUE
  try {
    final result = DartOpaque.login(password, userRecord);
    
    response.statusCode = HttpStatus.ok;
    response.headers.contentType = ContentType.json;
    response.write(jsonEncode({
      'success': result['success'],
      'exportKey': result['exportKey'],
      'username': username,
    }));
    await response.close();
  } catch (e) {
    response.statusCode = HttpStatus.unauthorized;
    response.write(jsonEncode({'error': 'Invalid password'}));
    await response.close();
  }
}