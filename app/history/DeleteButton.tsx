"use client";
import { deleteMealLog } from "./actions";

export default function DeleteButton({ logId }: { logId: string }) {
    return (
        <button 
           onClick={async () => {
              if (confirm("Delete this meal log completely?")) {
                  await deleteMealLog(logId);
              }
           }} 
           className="text-[10px] uppercase font-bold tracking-wider text-red-500 bg-red-50 px-2 py-1 rounded-md hover:bg-red-100 transition-colors ml-2"
        >
           Delete
        </button>
    );
}
