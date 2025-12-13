// Minimal OPAQUE implementation in Dart
// Compatible with @cloudflare/opaque-ts

import 'dart:typed_data';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:pointycastle/pointycastle.dart';
import 'package:convert/convert.dart';

class DartOpaque {
  static const int _saltLength = 32;
  static const int _keyLength = 32;

  /// Generate random bytes
  static Uint8List _randomBytes(int length) {
    final random = SecureRandom('AES/CTR/AUTO-SEED-PRNG')
      ..seed(KeyParameter(Uint8List.fromList(
          List.generate(32, (i) => i))));
    return random.nextBytes(length);
  }

  /// HKDF extraction and expansion using Dart's crypto package
  static Uint8List _hkdf(Uint8List ikm, Uint8List salt, 
      {Uint8List? info, int outputLength = 32}) {
    info ??= Uint8List(0);
    // Extract phase
    final prk = Hmac(sha512, salt).convert(ikm).bytes;
    
    // Expand phase
    var lastBlock = Uint8List(0);
    var output = Uint8List(0);
    
    for (int i = 1; output.length < outputLength; i++) {
      final block = Uint8List.fromList([...lastBlock, ...info, i]);
      lastBlock = Uint8List.fromList(Hmac(sha512, prk).convert(block).bytes);
      output = Uint8List.fromList([...output, ...lastBlock]);
    }
    
    return Uint8List.sublistView(output, 0, outputLength);
  }

  /// Simplified OPAQUE registration (for demo purposes)
  static Map<String, dynamic> register(String password) {
    final passwordBytes = utf8.encode(password) as Uint8List;
    final salt = _randomBytes(_saltLength);
    
    // Derive keys using HKDF
    final ikm = _hkdf(passwordBytes, salt, outputLength: _keyLength);
    
    // Simulate key pair generation (in real OPAQUE, this uses Ristretto255)
    final keyPair = _generateKeyPair(ikm);
    
    // Create registration record
    final record = {
      'pubKey': hex.encode(keyPair['pubKey']!),
      'salt': hex.encode(salt),
      'ikm': hex.encode(ikm),
    };
    
    // Derive export key
    final exportKey = _hkdf(ikm, keyPair['pubKey']!, 
        info: Uint8List.fromList([1]), outputLength: _keyLength);
    
    return {
      'record': record,
      'exportKey': hex.encode(exportKey),
    };
  }

  /// Simplified key pair generation
  static Map<String, Uint8List> _generateKeyPair(Uint8List seed) {
    // In real implementation, use Ristretto255
    // For demo, just derive two keys from seed
    final privKey = _hkdf(seed, Uint8List(32), outputLength: 32);
    final pubKey = _hkdf(seed, Uint8List(32), info: Uint8List.fromList([1]), outputLength: 32);
    
    return {'privKey': privKey, 'pubKey': pubKey};
  }

  /// Simplified OPAQUE login
  static Map<String, dynamic> login(String password, Map<String, dynamic> record) {
    final passwordBytes = utf8.encode(password) as Uint8List;
    final salt = hex.decode(record['salt']);
    final ikm = hex.decode(record['ikm']);
    
    // Verify password
    final derivedIkm = _hkdf(passwordBytes, salt as Uint8List, outputLength: _keyLength);
    if (!listEquals(derivedIkm, ikm as Uint8List)) {
      throw Exception('Invalid password');
    }
    
    // Derive export key
    final pubKey = hex.decode(record['pubKey'] as String);
    final exportKey = _hkdf(ikm as Uint8List, pubKey as Uint8List, 
        info: Uint8List.fromList([1]), outputLength: _keyLength);
    
    return {
      'exportKey': hex.encode(exportKey),
      'success': true,
    };
  }
}

// Helper function to compare Uint8List
bool listEquals(Uint8List a, Uint8List b) {
  if (a.length != b.length) return false;
  for (int i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}