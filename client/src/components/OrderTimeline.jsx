

const STAGES = ["Pending", "Confirmed", "Packed", "Shipped", "Out For Delivery", "Delivered"];

const OrderTimeline = ({ status = "Pending", statusHistory = [], trackingId = "", estimatedDelivery }) => {
  const isCancelled = status === "Cancelled";
  const isReturned = status === "Returned" || status === "Refunded";

  // Determine current active stage index
  let activeIndex = STAGES.indexOf(status);
  if (activeIndex === -1) {
    if (status === "Processing") activeIndex = 1;
    else activeIndex = 0;
  }

  return (
    <div className="w-full space-y-6">
      {/* Stage Stepper Banner */}
      {isCancelled ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
          <span className="text-rose-600 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span> Order Cancelled
          </span>
        </div>
      ) : isReturned ? (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
          <span className="text-purple-700 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-600"></span> Order Returned / Refunded
          </span>
        </div>
      ) : (
        <div className="relative py-4">
          <div className="flex items-center justify-between relative z-10">
            {STAGES.map((stage, idx) => {
              const isCompleted = idx <= activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div key={stage} className="flex flex-col items-center flex-1 text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-md ${
                      isCompleted
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    } ${isCurrent ? "scale-110 animate-bounce" : ""}`}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-2 ${
                      isCompleted ? "text-gray-900 font-bold" : "text-gray-400"
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar Track */}
          <div className="absolute top-9 left-6 right-6 h-1 bg-gray-200 -z-0 rounded-full">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{
                width: `${(activeIndex / (STAGES.length - 1)) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Meta Bar: Tracking ID & Delivery Estimate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
        <div>
          <span className="text-gray-500 block">Tracking ID</span>
          <span className="font-mono font-bold text-gray-900">{trackingId || "Assigned upon shipment"}</span>
        </div>
        <div>
          <span className="text-gray-500 block">Estimated Delivery</span>
          <span className="font-bold text-indigo-600">
            {estimatedDelivery ? new Date(estimatedDelivery).toLocaleDateString() : "3-5 Business Days"}
          </span>
        </div>
      </div>

      {/* Status History Logs */}
      {statusHistory && statusHistory.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tracking History</h4>
          <div className="space-y-2 border-l-2 border-indigo-100 pl-4">
            {statusHistory.map((item, i) => (
              <div key={i} className="relative text-xs">
                <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                <div className="font-bold text-gray-800">{item.status}</div>
                {item.comment && <div className="text-gray-600">{item.comment}</div>}
                <div className="text-[10px] text-gray-400">
                  {new Date(item.timestamp || item.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;
