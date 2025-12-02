import { lazy, type ComponentType } from 'react'

type RechartsModule = typeof import('recharts')

function lazyRecharts(selector: (module: RechartsModule) => ComponentType<any>) {
  return lazy(async () => {
    const mod = await import('recharts')
    return { default: selector(mod) as ComponentType<any> }
  })
}

export const LineChart = lazyRecharts((m) => m.LineChart)
export const Line = lazyRecharts((m) => m.Line)
export const BarChart = lazyRecharts((m) => m.BarChart)
export const Bar = lazyRecharts((m) => m.Bar as unknown as ComponentType<any>)
export const XAxis = lazyRecharts((m) => m.XAxis)
export const YAxis = lazyRecharts((m) => m.YAxis)
export const CartesianGrid = lazyRecharts((m) => m.CartesianGrid)
export const Tooltip = lazyRecharts((m) => m.Tooltip)
export const Legend = lazyRecharts((m) => m.Legend)
export const ResponsiveContainer = lazyRecharts((m) => m.ResponsiveContainer)
export const PieChart = lazyRecharts((m) => m.PieChart)
export const Pie = lazyRecharts((m) => m.Pie as unknown as ComponentType<any>)
export const Cell = lazyRecharts((m) => m.Cell)
export const AreaChart = lazyRecharts((m) => m.AreaChart)
export const Area = lazyRecharts((m) => m.Area as unknown as ComponentType<any>)
