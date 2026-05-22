import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
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
import { CategoryDistributionItem } from '../../../../core/models/dashboard-stats.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

const CHART_COLORS = [
  '#2E6DA4',
  '#E8A020',
  '#8E4FB8',
  '#3A8AAE',
  '#C0392B',
  '#3A8A3F',
  '#6B7A8D',
  '#B4C0CC',
];

@Component({
  selector: 'app-category-chart',
  standalone: true,
  imports: [BaseChartDirective, EmptyStateComponent],
  providers: [provideCharts({ registerables: [DoughnutController, ArcElement, Tooltip, Legend] })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-chart.component.html',
  styleUrl: './category-chart.component.scss',
})
export class CategoryChartComponent {
  readonly data = input.required<CategoryDistributionItem[]>();

  protected readonly hasData = computed(() => this.data().length > 0);

  protected readonly totalCount = computed(() =>
    this.data().reduce((sum, d) => sum + d.count, 0)
  );

  protected readonly chartData = computed<ChartData<'doughnut'>>(() => {
    const items = this.data();
    return {
      labels: items.map((d) => d.categoryName),
      datasets: [
        {
          data: items.map((d) => d.count),
          backgroundColor: items.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          hoverOffset: 6,
          borderWidth: 2,
          borderColor: '#ffffff',
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
