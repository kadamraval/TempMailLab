"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { device: "desktop", visitors: 275, fill: "var(--color-desktop)" },
  { device: "mobile", visitors: 200, fill: "var(--color-mobile)" },
  { device: "tablet", visitors: 187, fill: "var(--color-tablet)" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
  tablet: {
    label: "Tablet",
    color: "hsl(var(--chart-3))",
  },
}

export function DeviceChart() {
  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0)
  }, [])

  return (
    <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-full w-full"
    >
        <PieChart>
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
        />
        <Pie
            data={chartData}
            dataKey="visitors"
            nameKey="device"
            innerRadius={60}
            strokeWidth={5}
        >
            <Label
            content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                    <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    >
                    <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-3xl font-bold"
                    >
                        {totalVisitors.toLocaleString()}
                    </tspan>
                    <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
                    >
                        Visitors
                    </tspan>
                    </text>
                )
                }
            }}
            />
        </Pie>
        </PieChart>
    </ChartContainer>
  )
}
