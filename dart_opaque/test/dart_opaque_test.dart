import 'package:test/test.dart';
import 'package:dart_opaque/dart_opaque.dart';

void main() {
  group('DartOpaque', () {
    test('Registration and login flow', () {
      // Test registration
      final password = 'test_password_123';
      final result = DartOpaque.register(password);
      
      expect(result['record'], isNotNull);
      expect(result['exportKey'], isNotNull);
      expect(result['exportKey'].length, 64); // 32 bytes in hex
      
      // Test login with correct password
      final loginResult = DartOpaque.login(password, result['record']);
      expect(loginResult['success'], isTrue);
      expect(loginResult['exportKey'], result['exportKey']);
      
      // Test login with wrong password
      expect(() => DartOpaque.login('wrong_password', result['record']), 
          throwsException);
    });
    
    test('Export key consistency', () {
      final password = 'consistent_key_test';
      final result = DartOpaque.register(password);
      
      // Login with same record should produce same export key
      final loginResult = DartOpaque.login(password, result['record']);
      expect(loginResult['exportKey'], equals(result['exportKey']));
      expect(loginResult['success'], isTrue);
    });
  });
}