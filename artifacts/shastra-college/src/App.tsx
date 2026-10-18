import { useEffect, useLayoutEffect, useRef } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getGetCoursesMenuQueryKey, useGetCoursesMenu } from '@workspace/api-client-react';
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
import PublicCourseDetailPage, { PublicCourseLinkOnlyPage } from '@/pages/public-course-detail';
import { getCourseDetail, LEGACY_COURSE_SLUGS } from '@/pages/course-detail-config';
import {
  ContactPage,
} from '@/pages/public-destination-page';
import KnowledgeHubPage from '@/pages/public-knowledge-hub';
import PublicArticleHubPage from '@/pages/public-article-hub';
import PublicArticleDetailPage from '@/pages/public-article-detail';
import PublicVideoHubPage from '@/pages/public-video-hub';
import PublicStudyResourcesPage from '@/pages/public-study-resources';
import PublicExamUpdatesPage from '@/pages/public-exam-updates';
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
  const courseSlug = params?.courseSlug ?? '';
  const course = match ? getCourseDetail(courseSlug) : undefined;
  const isLegacyCourse = match && !course && LEGACY_COURSE_SLUGS.has(courseSlug);
  const menu = useGetCoursesMenu({ query: { queryKey: getGetCoursesMenuQueryKey() } });
  const menuCourse = menu.data?.courseCards.find((card) =>
    card.isVisible && card.destination.match(/^\/courses\/([^/?#]+)/)?.[1] === courseSlug,
  );
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (isLegacyCourse) setLocation('/courses');
  }, [isLegacyCourse, setLocation]);
  if (course) return <PublicCourseDetailPage course={course} />;
  if (menuCourse) return <PublicCourseLinkOnlyPage course={{ slug: courseSlug, name: menuCourse.title }} />;
  if (menu.isLoading && !isLegacyCourse) return <main className="min-h-[55vh]" aria-busy="true" />;
  return <NotFound />;
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

function PublicRouteScrollManager() {
  const [path] = useLocation();
  const previousPath = useRef(path);
  const historyTraversalPath = useRef<string | null>(null);

  useEffect(() => {
    const markHistoryTraversal = () => {
      historyTraversalPath.current = window.location.pathname;
    };
    window.addEventListener('popstate', markHistoryTraversal);
    return () => window.removeEventListener('popstate', markHistoryTraversal);
  }, []);

  useLayoutEffect(() => {
    if (previousPath.current === path) return;
    previousPath.current = path;

    const traversedPath = historyTraversalPath.current;
    historyTraversalPath.current = null;
    if (traversedPath === window.location.pathname) {
      return;
    }

    const isPublicPath =
      !path.startsWith('/admin') &&
      !path.startsWith('/sign-in') &&
      !path.startsWith('/sign-up');
    if (!isPublicPath) return;

    const hash = window.location.hash;
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    let observer: MutationObserver | undefined;
    let timeout: number | undefined;
    const targetId = (() => {
      try {
        return decodeURIComponent(hash.slice(1));
      } catch {
        return hash.slice(1);
      }
    })();
    const scrollToTarget = () => {
      const target = document.getElementById(targetId);
      if (!target) return false;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      observer?.disconnect();
      if (timeout !== undefined) window.clearTimeout(timeout);
      return true;
    };

    if (scrollToTarget()) return;
    observer = new MutationObserver(scrollToTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    timeout = window.setTimeout(() => observer?.disconnect(), 3000);

    return () => {
      observer?.disconnect();
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [path]);

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
        <PublicRouteScrollManager />
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/courses" component={CoursesPage} />
          <Route path="/courses/:courseSlug" component={CourseDetailRoute} />
          <Route path="/faculty" component={FacultyPage} />
          <Route path="/gallery" component={GalleryPage} />
          <Route path="/knowledge-hub" component={KnowledgeHubPage} />
          <Route path="/knowledge-hub/article-hub/:slug" component={PublicArticleDetailPage} />
          <Route path="/knowledge-hub/article-hub" component={PublicArticleHubPage} />
          <Route path="/knowledge-hub/video-hub" component={PublicVideoHubPage} />
          <Route path="/knowledge-hub/study-resources" component={PublicStudyResourcesPage} />
          <Route path="/knowledge-hub/exam-updates" component={PublicExamUpdatesPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function AppRoutes() {
  const [path] = useLocation();
  if (path === "/admin" || path === "/admin/") {
    return (
      <QueryClientProvider client={queryClient}>
        <AdminPage />
      </QueryClientProvider>
    );
  }
  return <RoutedApp />;
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <AppRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
