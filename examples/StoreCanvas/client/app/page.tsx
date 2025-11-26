'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Smartphone, Tablet, Image as ImageIcon, Zap, Palette, Download } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image
                src="https://cdn.linconwaves.com/linconwaves/no-bg-linconwaves.png"
                alt="StoreCanvas"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-semibold font-['Libertinus_Sans_Regular']">StoreCanvas</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-['Libertinus_Sans_Regular']">
            Generate stunning App Store & Play Store assets in minutes
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Create professional screenshots, feature graphics, and promotional assets for iOS App Store and Google Play Store. Design once, export for all device sizes with pixel-perfect precision.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">App Store Screenshots</h3>
            <p className="text-muted-foreground">
              Generate screenshots for iPhone 6.7", 6.5", 5.5" and iPad 12.9" in portrait and landscape orientations.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Play Store Assets</h3>
            <p className="text-muted-foreground">
              Create feature graphics (1024x500), phone and tablet screenshots that meet Google Play requirements.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Focused Editing</h3>
            <p className="text-muted-foreground">
              Full-screen canvas mode keeps layers, properties, and previews in view so you can design without distractions.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Palette className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Brand Consistency</h3>
            <p className="text-muted-foreground">
              Define your brand kit once with colors, logos, and fonts. Apply consistently across all assets.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Export to All Sizes</h3>
            <p className="text-muted-foreground">
              Design once, export to multiple preset sizes. Download assets ready for immediate upload to stores.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Tablet className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Store Guidelines</h3>
            <p className="text-muted-foreground">
              Safe zones, text areas, and constraints built-in to ensure compliance with App Store and Play Store rules.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-20 text-center border-t border-border">
          <h2 className="text-3xl font-bold mb-6 font-['Libertinus_Sans_Regular']">
            Ready to create stunning store assets?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join developers and designers who trust StoreCanvas to create professional assets for their apps.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-8">
              Get Started Now
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 StoreCanvas. Generate App Store & Play Store assets with confidence.</p>
        </div>
      </footer>
    </div>
  );
}
