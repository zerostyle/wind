"use client"

import { RiMoonLine, RiSunLine } from "@remixicon/react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Switch } from "@/components/ui/switch"

export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLight = mounted && resolvedTheme === "light"

  return (
    <div className="inline-flex items-center gap-2.5">
      <RiMoonLine
        className={`size-3.5 ${isLight ? "text-muted-foreground" : "text-foreground"}`}
        aria-hidden="true"
      />
      <Switch
        checked={isLight}
        onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
        disabled={!mounted}
        aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      />
      <RiSunLine
        className={`size-3.5 ${isLight ? "text-foreground" : "text-muted-foreground"}`}
        aria-hidden="true"
      />
    </div>
  )
}
