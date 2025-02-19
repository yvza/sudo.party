import type { VariantProps } from "class-variance-authority";

export interface PostProps {
  params: Prmoise<{ slug: string }>
}

export interface DialogProps {
  show: boolean
  title: string
  description: string
  onCancel?: () => void | Promise<void>
  onAction: () => void | Promise<void>
}

export interface HeaderBrandProps {
  fontSize?: string,
  sloganOn?: boolean,
  hideOnMobile?: boolean
}

export interface PaginationProps {
  totalPages: number
  currentPage?: number
}

export interface PayloadFilter {
  searchQuery: string,
  checkbox: {
    method: boolean,
    bot: boolean
  }
}

export interface FilterProps {
  onFilterCallback: (query: PayloadFilter) => void
  searchedQuery: PayloadFilter
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export interface UseToastProps {
  toasts: ToasterToast[]
}

interface ProductRelease {
  // name: string, // need to change this to id for individual release, change 'name' to 'idRelease'. need hashing algorithm
  idRelease: string,
  version: string,
  date: string,
  releasePurchaseStatus: number
}

export interface ProductType {
  product: {
    banner: string,
    // id: number, // need to encode this for safety reason. maybe turning named 'id' to 'idProduct'. need hashing algorithm
    idProduct: string,
    category: number,
    name: string,
    price: number,
    status: number,
    release?: ProductRelease[]
  }
  productPurchaseStatus: number
}

export interface ArticlesProps {
  data: {
    data: Array<number>,
    type: string
  },
  error: unknown,
  isFetched: boolean
}

export interface articleMetadata {
  visibility: string,
  title: string,
  date: string,
  membership: string | undefined,
  mdx: string,
}

export interface siweSession {
  address: string,
  isAuthenticated: boolean
}