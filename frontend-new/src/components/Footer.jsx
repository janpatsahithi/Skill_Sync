import { Twitter, Linkedin, Github, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div>
            
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered career guidance to help you bridge skill gaps and land your dream job.
            </p>

            <div className="flex gap-3">
              <a className="p-2 rounded-lg bg-muted hover:bg-muted/70"><Twitter size={16} /></a>
              <a className="p-2 rounded-lg bg-muted hover:bg-muted/70"><Linkedin size={16} /></a>
              <a className="p-2 rounded-lg bg-muted hover:bg-muted/70"><Github size={16} /></a>
              <a className="p-2 rounded-lg bg-muted hover:bg-muted/70"><Mail size={16} /></a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Features</li>
              <li>How it Works</li>
              <li>Pricing</li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Blog</li>
              <li>Careers</li>
              <li>Support</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 text-center text-sm text-muted-foreground">
          © 2026 SkillSync. All rights reserved. Built with ❤️ for career growth.
        </div>
      </div>
    </footer>
  );
} 


