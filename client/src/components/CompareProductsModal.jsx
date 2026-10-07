

const CompareProductsModal = ({ isOpen, onClose, compareProducts, onRemoveFromCompare, onAddToCart }) => {
  if (!isOpen || !compareProducts || compareProducts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="text-2xl font-black text-gray-900">Compare Products</h3>
            <p className="text-xs text-gray-500">Side-by-side spec comparison of your selected items</p>
          </div>
          <button onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-700 font-bold">
            &times;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="p-3 w-36 font-extrabold text-gray-400 uppercase">Product</th>
                {compareProducts.map((p) => {
                  const img = p.thumbnail || (p.images && p.images[0]?.url) || p.image;
                  return (
                    <th key={p._id} className="p-3 text-center min-w-[160px] align-top">
                      <div className="relative group space-y-2">
                        <button
                          onClick={() => onRemoveFromCompare(p._id)}
                          className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs"
                          title="Remove from compare"
                        >
                          &times;
                        </button>
                        <img src={img} alt={p.title} className="w-24 h-28 object-cover rounded-xl mx-auto shadow-sm" />
                        <div className="font-extrabold text-gray-900 text-xs line-clamp-2">{p.title}</div>
                        <button
                          onClick={() => onAddToCart && onAddToCart(p)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-xl text-[11px] shadow-sm transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-3 font-bold text-gray-500">Price</td>
                {compareProducts.map((p) => (
                  <td key={p._id} className="p-3 text-center font-extrabold text-indigo-600 text-sm">
                    ₹{p.discountPrice || p.price}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-gray-500">Brand</td>
                {compareProducts.map((p) => (
                  <td key={p._id} className="p-3 text-center font-semibold text-gray-800">
                    {p.brand}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-gray-500">Category</td>
                {compareProducts.map((p) => (
                  <td key={p._id} className="p-3 text-center text-gray-700">
                    {p.category}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-gray-500">Rating</td>
                {compareProducts.map((p) => (
                  <td key={p._id} className="p-3 text-center font-bold text-amber-500">
                    ★ {p.rating || 4.5} ({p.numReviews || 12})
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-gray-500">Material</td>
                {compareProducts.map((p) => (
                  <td key={p._id} className="p-3 text-center text-gray-600">
                    {p.material || "Cotton Blend"}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-gray-500">Occasion</td>
                {compareProducts.map((p) => (
                  <td key={p._id} className="p-3 text-center text-gray-600">
                    {p.occasion || "Casual"}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-bold text-gray-500">Delivery Estimate</td>
                {compareProducts.map((p) => (
                  <td key={p._id} className="p-3 text-center text-emerald-600 font-bold">
                    {p.deliveryDays || 5} Business Days
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompareProductsModal;
