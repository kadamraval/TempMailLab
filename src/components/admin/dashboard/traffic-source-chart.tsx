
"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { source: "Google", visitors: Math.floor(Math.random() * 500) + 200, fill: "var(--color-google)" },
  { source: "Direct", visitors: Math.floor(Math.random() * 400) + 150, fill: "var(--color-direct)" },
  { source: "Bing", visitors: Math.floor(Math.random() * 300) + 100, fill: "var(--color-bing)" },
  { source: "Social", visitors: Math.floor(Math.random() * 200) + 50, fill: "var(--color-social)" },
  { source: "Other", visitors: Math.floor(Math.random() * 150) + 50, fill: "var(--color-other)" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  google: {
    label: "Google",
    color: "hsl(var(--chart-1))",
  },
  direct: {
    label: "Direct",
    color: "hsl(var(--chart-2))",
  },
  bing: {
    label: "Bing",
    color: "hsl(var(--chart-3))",
  },
  social: {
    label: "Social",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
}

export function TrafficSourceChart() {
  return (
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-full">
        <BarChart accessibilityLayer data={chartData} layout="vertical">
          <CartesianGrid horizontal={false} />
          <XAxis type="number" dataKey="visitors" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar
            dataKey="visitors"
            layout="vertical"
            radius={5}
            barSize={20}
          />
        </BarChart>
      </ChartContainer>
  )
}
