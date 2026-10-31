import React from "react";

export function ExamLayoutSkeletonWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8 animate-pulse">
      <header className="space-y-6">
        <div className="h-4 w-32 bg-border rounded"></div>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 w-full max-w-2xl">
            <div className="flex gap-2">
               <div className="h-5 w-16 bg-primary/20 rounded"></div>
               <div className="h-5 w-24 bg-border/50 rounded"></div>
            </div>
            <div className="h-8 w-64 bg-border rounded"></div>
            
            <div className="flex gap-4">
              <div className="h-4 w-32 bg-border/50 rounded"></div>
              <div className="h-4 w-40 bg-border/50 rounded"></div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <div className="h-10 w-24 bg-border rounded-md"></div>
             <div className="h-10 w-24 bg-border rounded-md"></div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-border pb-0 overflow-hidden">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-10 w-24 bg-border/30 rounded-t-md mx-2"></div>)}
        </div>
      </header>
      
      <div className="pt-2">
         {children}
      </div>
    </div>
  )
}
