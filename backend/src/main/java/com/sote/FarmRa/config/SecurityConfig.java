package com.sote.FarmRa.config;

import java.util.List;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    var path = PathPatternRequestMatcher.withDefaults();

    http
      .cors(Customizer.withDefaults())
      .csrf(csrf -> csrf.disable())
      .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
      .exceptionHandling(e -> e.authenticationEntryPoint(
        (req, res, ex) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED)
      ))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

        // ✅ public endpoints
        .requestMatchers(path.matcher(HttpMethod.POST, "/api/signup")).permitAll()
        .requestMatchers(path.matcher(HttpMethod.POST, "/api/login")).permitAll()
        .requestMatchers(path.matcher(HttpMethod.POST, "/api/logout")).permitAll()

        .requestMatchers(path.matcher(HttpMethod.GET, "/api/me")).authenticated()

        .requestMatchers(path.matcher("/error")).permitAll()
        .anyRequest().authenticated()
      )
      .httpBasic(Customizer.withDefaults())
      .formLogin(form -> form.disable())
      .logout(logout -> logout.disable());

    return http.build();
  }

  @Bean
public CorsConfigurationSource corsConfigurationSource() {
  CorsConfiguration config = new CorsConfiguration();

  // ✅ allow any localhost port (4200, 64544, etc.)
  config.setAllowedOriginPatterns(List.of(
      "http://localhost:*",
      "http://127.0.0.1:*"
  ));

  config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

  // ✅ easiest: allow all headers (prevents random 403s)
  config.setAllowedHeaders(List.of("*"));

  // optional: if you ever need to read these headers in the browser
  config.setExposedHeaders(List.of("Set-Cookie"));

  config.setAllowCredentials(true);
  config.setMaxAge(3600L);

  UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
  source.registerCorsConfiguration("/**", config);
  return source;
}


  // ✅ return InMemoryUserDetailsManager so SignupController can inject it
  @Bean
  public InMemoryUserDetailsManager userDetailsService(PasswordEncoder encoder) {
    UserDetails user = User.withUsername("test@unt.edu")
      .password(encoder.encode("password123"))
      .roles("FARMER")
      .build();
    return new InMemoryUserDetailsManager(user);
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
  }
}
