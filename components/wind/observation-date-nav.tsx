"use client"

import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  observationDateHref,
  shiftCalendarDate,
} from "@/lib/wind/observation-date"

type ObservationDateNavProps = {
  selectedDate: string
  todayDate: string
}

export function ObservationDateNav({
  selectedDate,
  todayDate,
}: ObservationDateNavProps) {
  const router = useRouter()
  const previousDate = shiftCalendarDate(selectedDate, -1)
  const nextDate = shiftCalendarDate(selectedDate, 1)
  const canGoNext = nextDate <= todayDate
  const isToday = selectedDate === todayDate

  return (
    <nav
      className="flex items-center gap-1"
      aria-label="Observed wind day"
    >
      <Link
        href={observationDateHref(previousDate, todayDate)}
        scroll={false}
        className="inline-flex size-8 items-center justify-center border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label={`Previous day, ${previousDate}`}
      >
        <RiArrowLeftSLine className="size-4" />
      </Link>
      <input
        type="date"
        value={selectedDate}
        max={todayDate}
        onChange={(event) => {
          const value = event.target.value
          if (!value) {
            return
          }

          router.push(observationDateHref(value, todayDate), { scroll: false })
        }}
        aria-label="Select an archived date"
        className="h-8 border border-border bg-background px-2 font-mono text-[10px] font-semibold tracking-[0.04em] text-foreground [color-scheme:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      {canGoNext ? (
        <Link
          href={observationDateHref(nextDate, todayDate)}
          scroll={false}
          className="inline-flex size-8 items-center justify-center border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={`Next day, ${nextDate}`}
        >
          <RiArrowRightSLine className="size-4" />
        </Link>
      ) : (
        <span
          className="inline-flex size-8 items-center justify-center border border-border text-muted-foreground opacity-40"
          aria-disabled="true"
        >
          <RiArrowRightSLine className="size-4" />
        </span>
      )}
      {isToday ? null : (
        <Link
          href="/"
          scroll={false}
          className="ml-1 inline-flex h-8 items-center px-2.5 font-mono text-[9px] font-semibold tracking-[0.08em] text-observed uppercase transition-colors hover:bg-observed/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Today
        </Link>
      )}
    </nav>
  )
}
