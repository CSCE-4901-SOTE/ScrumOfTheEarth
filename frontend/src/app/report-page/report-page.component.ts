import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

Chart.register(...registerables);

type Interval = 'hourly' | 'daily' | 'weekly' | 'monthly';

interface SensorOption {
  node_id: string;
  node_name: string;
}

interface HistoryRow {
  bucket: string;
  avg_temperature: number;
  avg_moisture: number;
  avg_light: number;
}

@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, BaseChartDirective],
  templateUrl: './report-page.component.html',
  styleUrl: './report-page.component.css'
})
export class ReportPageComponent implements OnInit {
  apiBase = environment.backendUrl;

  sensors: SensorOption[] = [];
  selectedSensorId = '';
  selectedInterval: Interval = 'hourly';
  loading = false;
  noData = false;

  intervals: { label: string; value: Interval }[] = [
    { label: 'Hourly',   value: 'hourly'   },
    { label: 'Daily',    value: 'daily'    },
    { label: 'Weekly',   value: 'weekly'   },
    { label: 'Monthly',  value: 'monthly'  },
  ];

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { maxTicksLimit: 10, maxRotation: 0 } },
      y: { beginAtZero: false },
    },
  };

  tempData: ChartData<'line'>     = this.emptyChart('#e05c5c', 'rgba(224,92,92,0.1)');
  moistureData: ChartData<'line'> = this.emptyChart('#3c8e3f', 'rgba(60,142,63,0.1)');
  lightData: ChartData<'line'>    = this.emptyChart('#e6b800', 'rgba(230,184,0,0.1)');

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const role   = sessionStorage.getItem('role');
    const userId = sessionStorage.getItem('userId');
    if (!role || !userId) return;

    const url = role === 'farmer'
      ? `${this.apiBase}/sensors/latest/customer/${userId}`
      : `${this.apiBase}/sensors/latest/technician/${userId}`;

    this.http.get<any[]>(url).pipe(catchError(() => of([]))).subscribe(rows => {
      this.sensors = (rows ?? []).map(r => ({ node_id: r.node_id, node_name: r.node_name }));
      if (this.sensors.length > 0) {
        this.selectedSensorId = this.sensors[0].node_id;
        this.loadHistory();
      }
    });
  }

  loadHistory(): void {
    if (!this.selectedSensorId) return;
    this.loading = true;
    this.noData  = false;

    const url = `${this.apiBase}/readings/history/${this.selectedSensorId}?interval=${this.selectedInterval}`;

    this.http.get<HistoryRow[]>(url).pipe(catchError(() => of([]))).subscribe(rows => {
      this.loading = false;
      this.noData  = rows.length === 0;
      if (rows.length === 0) return;

      const labels = rows.map(r => this.formatBucket(r.bucket));

      this.tempData = {
        labels,
        datasets: [{ data: rows.map(r => round(r.avg_temperature)), ...lineStyle('#e05c5c', 'rgba(224,92,92,0.1)') }],
      };
      this.moistureData = {
        labels,
        datasets: [{ data: rows.map(r => round(r.avg_moisture)), ...lineStyle('#3c8e3f', 'rgba(60,142,63,0.1)') }],
      };
      this.lightData = {
        labels,
        datasets: [{ data: rows.map(r => round(r.avg_light ?? 0)), ...lineStyle('#e6b800', 'rgba(230,184,0,0.1)') }],
      };
    });
  }

  private formatBucket(bucket: string): string {
    const d = new Date(bucket);
    switch (this.selectedInterval) {
      case 'hourly':  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'daily':   return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case 'weekly': {
        const end = new Date(d);
        end.setDate(d.getDate() + 6);
        const fmt = (x: Date) => x.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `${fmt(d)} - ${fmt(end)}`;
      }
      case 'monthly': return d.toLocaleDateString([], { month: 'short', year: 'numeric' });
    }
  }

  private emptyChart(color: string, bg: string): ChartData<'line'> {
    return { labels: [], datasets: [{ data: [], ...lineStyle(color, bg) }] };
  }
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function lineStyle(borderColor: string, backgroundColor: string) {
  return { borderColor, backgroundColor, fill: true, tension: 0.3, pointRadius: 3 };
}
