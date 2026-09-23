import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import {
  ArcElement,
  DoughnutController,
  Legend,
  Tooltip,
  type ChartConfiguration,
  type ChartData,
} from 'chart.js';
import { CategoryDistributionItem } from '@core/models/dashboard-stats.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

// La paleta vive en el SCSS del componente (--chart-color-0 … 7, que apuntan a tokens). La leyenda
// la usa con var(); chart.js dibuja en canvas y no resuelve var(), así que lee los valores ya
// resueltos del host después del primer render.
const CHART_COLOR_COUNT = 8;

@Component({
  selector: 'app-category-chart',
  imports: [BaseChartDirective, EmptyStateComponent],
  providers: [provideCharts({ registerables: [DoughnutController, ArcElement, Tooltip, Legend] })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-chart.component.html',
  styleUrl: './category-chart.component.scss',
})
export class CategoryChartComponent {
  readonly data = input.required<CategoryDistributionItem[]>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly palette = signal<string[]>([]);
  private readonly borderColor = signal<string | undefined>(undefined);

  protected readonly colorCount = CHART_COLOR_COUNT;

  constructor() {
    afterNextRender(() => {
      const styles = getComputedStyle(this.host.nativeElement);
      const read = (name: string) => styles.getPropertyValue(name).trim();
      this.palette.set(
        Array.from({ length: CHART_COLOR_COUNT }, (_, i) => read(`--chart-color-${i}`)),
      );
      this.borderColor.set(read('--color-bg-card') || undefined);
    });
  }

  protected readonly hasData = computed(() => this.data().length > 0);

  protected readonly totalCount = computed(() => this.data().reduce((sum, d) => sum + d.count, 0));

  protected readonly chartData = computed<ChartData<'doughnut'>>(() => {
    const items = this.data();
    const palette = this.palette();
    return {
      labels: items.map((d) => d.categoryName),
      datasets: [
        {
          data: items.map((d) => d.count),
          backgroundColor: palette.length
            ? items.map((_, i) => palette[i % palette.length])
            : undefined,
          hoverOffset: 6,
          borderWidth: 2,
          borderColor: this.borderColor(),
        },
      ],
    };
  });

  protected readonly chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = this.data()[ctx.dataIndex];
            return ` ${ctx.label}: ${item.count} documentos (${item.percentage}%)`;
          },
        },
      },
    },
  };
}
