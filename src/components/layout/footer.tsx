'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function Footer() {
  const { data: session } = useSession();
  
  // Check if user can apply as reviewer (not already a reviewer or has pending application)
  const canApplyAsReviewer = !session?.user || (
    session.user.role === 'USER' && 
    session.user.reviewerStatus === 'NONE'
  );

  return (
    <footer className="border-t bg-gray-50">
      {/* Clinical Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-start space-x-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-600 flex-shrink-0 mt-0.5"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <p className="text-sm text-amber-800">
              <strong>Clinical Disclaimer:</strong> This tool is intended for use by healthcare professionals as a decision support aid. 
              It does not replace clinical judgment, direct patient evaluation, or individualized medical decision-making.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
              <span className="font-bold">Bayes at the Bedside</span>
            </Link>
            <p className="text-sm text-gray-600">
              Clinical decision support grounded in Bayesian reasoning.
            </p>
          </div>
          
          {/* Tools */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Tools</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/diagnostic" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Diagnostic Decision Tool
                </Link>
              </li>
              <li>
                <Link href="/treatment" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Treatment Effect Tool
                </Link>
              </li>
              <li>
                <Link href="/browse" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Evidence Library
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contribute */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Contribute</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/submit" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Submit Analysis
                </Link>
              </li>
              {canApplyAsReviewer && (
                <li>
                  <Link href="/apply-reviewer" className="text-gray-600 hover:text-green-600 transition-colors">
                    Become a Reviewer
                  </Link>
                </li>
              )}
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Methodology
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-6 border-t">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Bayes at the Bedside. Not for direct clinical use without professional judgment.
          </p>
        </div>
      </div>
    </footer>
  );
}
