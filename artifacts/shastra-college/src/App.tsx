import { useEffect, useRef } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import AdminPage from '@/pages/admin';
import HomePage from '@/pages/public-home';
import PublicSiteEffects from '@/components/public-site-effects';
import AboutPage from '@/pages/about';
import GalleryPage from '@/pages/gallery';
import FacultyPage from '@/pages/faculty';
import { PublicCoursesPage as CoursesPage } from '@/pages/public-courses';
import PublicCourseDetailPage from '@/pages/public-course-detail';
import { getCourseDetail } from '@/pages/course-detail-config';
import {
  ContactPage,
  KnowledgeHubPage,
} from '@/pages/public-destination-page';
import {
  Route,
  Switch,
  useLocation,
  useRoute,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const clerkAppearance = {
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#0B3472',
    colorForeground: '#15243d',
    colorMutedForeground: '#61718a',
    colorDanger: '#E3212B',
    colorBackground: '#ffffff',
    colorInput: '#f7f9fc',
    colorInputForeground: '#15243d',
    colorNeutral: '#d9e0ea',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.75rem',
  },
};

function SignInPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] px-4"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] px-4"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function CourseDetailRoute() {
  const [match, params] = useRoute<{ courseSlug: string }>('/courses/:courseSlug');
  const course = match ? getCourseDetail(params?.courseSlug ?? '') : undefined;
  return course ? <PublicCourseDetailPage course={course} /> : <NotFound />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = queryClient;
  const previousUser = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const nextUser = user?.id ?? null;
      if (previousUser.current !== undefined && previousUser.current !== nextUser) client.clear();
      previousUser.current = nextUser;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function RoutedApp() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to access the staff workspace',
          },
        },
        signUp: {
          start: {
            title: 'Create your account',
            subtitle: 'Your college content workspace awaits',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <QueryClientProvider client={queryClient}>
        <PublicSiteEffects />
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/courses" component={CoursesPage} />
          <Route path="/courses/:courseSlug" component={CourseDetailRoute} />
          <Route path="/faculty" component={FacultyPage} />
          <Route path="/gallery" component={GalleryPage} />
          <Route path="/knowledge-hub" component={KnowledgeHubPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <RoutedApp />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
