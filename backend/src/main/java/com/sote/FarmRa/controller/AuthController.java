package com.sote.FarmRa.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

  private final AuthenticationManager authManager;
  private final SecurityContextRepository securityContextRepository =
      new HttpSessionSecurityContextRepository();

  public AuthController(AuthenticationManager authManager) {
    this.authManager = authManager;
  }

  // ✅ Matches frontend payload: { email, password }
  public static class LoginRequest {
    public String email;
    public String password;
  }

  private String extractRole(Authentication auth) {
    if (auth == null || auth.getAuthorities() == null) return null;

    // Spring Security stores roles like ROLE_FARMER, ROLE_TECHNICIAN, etc.
    return auth.getAuthorities().stream()
        .map(GrantedAuthority::getAuthority)
        .filter(a -> a != null && a.startsWith("ROLE_"))
        .map(a -> a.substring("ROLE_".length()))
        .findFirst()
        .orElse(null);
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(
      @RequestBody LoginRequest body,
      HttpServletRequest request,
      HttpServletResponse response
  ) {
    if (body == null || body.email == null || body.password == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "email and password are required"));
    }

    Authentication auth = authManager.authenticate(
        new UsernamePasswordAuthenticationToken(body.email, body.password)
    );

    // ✅ Persist authentication into session (so withCredentials works)
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(auth);
    SecurityContextHolder.setContext(context);
    securityContextRepository.saveContext(context, request, response);

    String role = extractRole(auth);

    return ResponseEntity.ok(Map.of(
        "email", auth.getName(),
        "role", role
    ));
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout(HttpServletRequest request) {
    SecurityContextHolder.clearContext();
    var session = request.getSession(false);
    if (session != null) session.invalidate();
    return ResponseEntity.ok().build();
  }

  @GetMapping("/me")
  public ResponseEntity<?> me(Authentication authentication) {
    // ✅ Important: anonymous users can still be "isAuthenticated() == true"
    if (authentication == null ||
        authentication instanceof AnonymousAuthenticationToken ||
        !authentication.isAuthenticated()) {
      return ResponseEntity.status(401).body(Map.of("error", "Not logged in"));
    }

    String role = extractRole(authentication);

    return ResponseEntity.ok(Map.of(
        "email", authentication.getName(),
        "role", role
    ));
  }
}
