declare module "d3-scale" {
  export function scaleUtc(): {
    domain(domain: Date[]): unknown
    range(range: number[]): unknown
    nice(count?: number): unknown
    ticks(count?: number): Date[]
    tickFormat(count?: number, specifier?: string): (d: Date) => string
    copy(): unknown
  }
}
