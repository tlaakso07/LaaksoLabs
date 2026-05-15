export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="page-fade"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}
    >
      {children}
    </div>
  )
}
