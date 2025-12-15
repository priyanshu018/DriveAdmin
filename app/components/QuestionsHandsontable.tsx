"use client";

import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.css";
import { useRef } from "react";

registerAllModules();

export default function QuestionsHandsontable({
  data,
  onSave,
  onClose,
}: {
  data: any[];
  onSave: (rows: any[]) => void;
  onClose: () => void;
}) {
  const hotRef = useRef<any>(null);

  return (
    <div className="fixed inset-0 bg-white z-50 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Bulk Edit Questions</h2>

        <div className="flex gap-2">
          <button onClick={onClose} className="px-3 py-2 border text-sm">
            Cancel
          </button>

          <button
            onClick={() => {
              const hot = hotRef.current?.hotInstance;
              if (!hot) return;

              const updatedRows = hot.getSourceData();
              onSave(updatedRows);
            }}
            className="px-3 py-2 bg-black text-white text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>

      <HotTable
        ref={hotRef}
        data={data}
        rowHeaders
        stretchH="all"
        height="80vh"
        licenseKey="non-commercial-and-evaluation"
        colHeaders={[
          "Serial",
          "Question",
          "Option A",
          "Option B",
          "Correct Answer",
          "Explanation",
        ]}
        columns={[
          { data: "serial_number", readOnly: true, type: "text" },
          { data: "question", type: "text" },
          {
            data: "option_a",
            type: "dropdown",
            source: ["CORRECT", "INCORRECT"],
            strict: true,
          },
          {
            data: "option_b",
            type: "dropdown",
            source: ["CORRECT", "INCORRECT"],
            strict: true,
          },
          {
            data: "correct_answer",
            type: "dropdown",
            source: ["A", "B"],
            strict: true,
          },
          { data: "explanation", type: "text" },
        ]}
      />
    </div>
  );
}
