# Sidebar Component Modifications

This document tracks custom modifications made to the shadcn/ui sidebar
component.

## Mobile Fix Applied

**Issue**: Mobile sidebar wasn't working correctly due to React hydration
errors.

**Solution**: Modified the Sheet component structure in the mobile view (lines
203-225):

```typescript
// Custom structure to fix mobile hydration issue
<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
  <SheetHeader className="sr-only">
    <SheetTitle>Sidebar</SheetTitle>
    <SheetDescription>Displays the mobile sidebar.</SheetDescription>
  </SheetHeader>
  <SheetContent
    data-sidebar="sidebar"
    data-slot="sidebar"
    data-mobile="true"
    className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
    style={{
      "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
    } as React.CSSProperties}
    side={side}
  >
    <div className="flex h-full w-full flex-col">{children}</div>
  </SheetContent>
</Sheet>
```

## Other Customizations

1. **Tailwind CSS v4 Syntax**: Updated class names to use v4 syntax (e.g.,
   `w-(--sidebar-width)`)
2. **Sidebar Width**: Changed from default `16rem` to `20rem`
3. **Additional data attributes**: Added `data-slot` attributes for better
   component targeting

## Update Strategy

When updating the sidebar component:

1. Check if the latest version fixes the mobile hydration issue
2. If not, preserve the custom mobile fix
3. Manually merge any new features while keeping customizations
4. Test mobile functionality thoroughly after updates

## How to Update

```bash
# Check latest version (but don't overwrite)
npx shadcn@latest diff sidebar

# Or manually compare at:
# https://ui.shadcn.com/docs/components/sidebar
```
