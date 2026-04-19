import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-3">Customer Care</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-white">Help Center</Link></li>
            <li><Link href="#" className="hover:text-white">How to Buy</Link></li>
            <li><Link href="#" className="hover:text-white">Shipping</Link></li>
            <li><Link href="#" className="hover:text-white">Returns</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">About AI-DLC</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-white">About Us</Link></li>
            <li><Link href="#" className="hover:text-white">Careers</Link></li>
            <li><Link href="#" className="hover:text-white">Terms & Conditions</Link></li>
            <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Payment</h3>
          <ul className="space-y-2 text-sm">
            <li>Cash on Delivery</li>
            <li>Credit/Debit Card</li>
            <li>Mobile Banking</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Follow Us</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-white">Facebook</Link></li>
            <li><Link href="#" className="hover:text-white">Instagram</Link></li>
            <li><Link href="#" className="hover:text-white">Twitter</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 text-center text-sm py-4">
        © {new Date().getFullYear()} AI-DLC Shop. All rights reserved.
      </div>
    </footer>
  );
}
