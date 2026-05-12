export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-32 animate-pulse">
      <div className="px-5 pt-14 pb-5">
        <div className="h-2.5 w-20 bg-muted rounded-full mb-2" />
        <div className="h-9 w-36 bg-muted rounded-lg" />
      </div>
      <div className="px-5 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  )
}
