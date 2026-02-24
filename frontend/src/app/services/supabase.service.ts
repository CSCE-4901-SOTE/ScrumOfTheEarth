import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    }
  }

  // Expose client for advanced queries
  get client() {
    if (!this.supabase) throw new Error('Supabase client not available');
    return this.supabase;
  }

  // Auth
  async signUp(email: string, password: string) {
    if (!this.supabase) throw new Error('Supabase client not available');
    return await this.supabase.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    if (!this.supabase) throw new Error('Supabase client not available');
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    if (!this.supabase) throw new Error('Supabase client not available');
    return await this.supabase.auth.signOut();
  }

  getUser() {
    if (!this.supabase) return null;
    return this.supabase.auth.getUser();
  }

  // Sensors
  async getSensors() {
    if (!this.supabase) throw new Error('Supabase client not available');
    return await this.supabase.from('sensor_node').select('*');
  }

  async getSensorById(id: string) {
    if (!this.supabase) throw new Error('Supabase client not available');
    return await this.supabase.from('sensor_node').select('*').eq('id', id).single();
  }

  async updateSensor(id: string, updates: any) {
    if (!this.supabase) throw new Error('Supabase client not available');
    return await this.supabase.from('sensor_node').update(updates).eq('id', id);
  }

  // Readings
  async getReadings(nodeId: string, limit = 100) {
    if (!this.supabase) throw new Error('Supabase client not available');
    return await this.supabase.from('sensor_reading').select('*').eq('node_id', nodeId).order('reading_timestamp', { ascending: false }).limit(limit);
  }

  // Realtime subscriptions
  subscribeToSensor(sensorId: string, callback: (payload: any) => void) {
    if (!this.supabase) throw new Error('Supabase client not available');
    return this.supabase
      .channel(`sensor:${sensorId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sensor_node', filter: `id=eq.${sensorId}` }, callback)
      .subscribe();
  }
}
