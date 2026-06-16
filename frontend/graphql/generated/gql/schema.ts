export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: string; output: string; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: string; output: string; }
  /** A type representing a validated email address */
  Email: { input: string; output: string; }
  /** A type representing arbitrary JSON values */
  JSON: { input: unknown; output: unknown; }
  /** A type representing a validated phone number */
  PhoneNumber: { input: string; output: string; }
  /** A map of string keys to string values (Record<string, string>) */
  StringMap: { input: Record<string, string>; output: Record<string, string>; }
};

export enum AppLanguage {
  Ar = 'ar',
  En = 'en'
}

export type BulkOperationFailure = {
  __typename?: 'BulkOperationFailure';
  error: Maybe<Scalars['String']['output']>;
  path: Maybe<Scalars['String']['output']>;
};

export type BulkOperationResult = {
  __typename?: 'BulkOperationResult';
  failureCount: Maybe<Scalars['Int']['output']>;
  failures: Maybe<Array<BulkOperationFailure>>;
  message: Maybe<Scalars['String']['output']>;
  success: Maybe<Scalars['Boolean']['output']>;
  successCount: Maybe<Scalars['Int']['output']>;
  successfulItems: Maybe<Array<StorageObject>>;
};

export enum CountryCode {
  Ad = 'AD',
  Ae = 'AE',
  Af = 'AF',
  Ag = 'AG',
  Ai = 'AI',
  Al = 'AL',
  Am = 'AM',
  Ao = 'AO',
  Aq = 'AQ',
  Ar = 'AR',
  As = 'AS',
  At = 'AT',
  Au = 'AU',
  Aw = 'AW',
  Ax = 'AX',
  Az = 'AZ',
  Ba = 'BA',
  Bb = 'BB',
  Bd = 'BD',
  Be = 'BE',
  Bf = 'BF',
  Bg = 'BG',
  Bh = 'BH',
  Bi = 'BI',
  Bj = 'BJ',
  Bl = 'BL',
  Bm = 'BM',
  Bn = 'BN',
  Bo = 'BO',
  Br = 'BR',
  Bs = 'BS',
  Bt = 'BT',
  Bv = 'BV',
  Bw = 'BW',
  By = 'BY',
  Bz = 'BZ',
  Ca = 'CA',
  Cc = 'CC',
  Cd = 'CD',
  Cf = 'CF',
  Cg = 'CG',
  Ch = 'CH',
  Ci = 'CI',
  Ck = 'CK',
  Cl = 'CL',
  Cm = 'CM',
  Cn = 'CN',
  Co = 'CO',
  Cr = 'CR',
  Cu = 'CU',
  Cv = 'CV',
  Cw = 'CW',
  Cx = 'CX',
  Cy = 'CY',
  Cz = 'CZ',
  De = 'DE',
  Dj = 'DJ',
  Dk = 'DK',
  Dm = 'DM',
  Do = 'DO',
  Dz = 'DZ',
  Ec = 'EC',
  Ee = 'EE',
  Eg = 'EG',
  Eh = 'EH',
  Er = 'ER',
  Es = 'ES',
  Et = 'ET',
  Fi = 'FI',
  Fj = 'FJ',
  Fk = 'FK',
  Fm = 'FM',
  Fo = 'FO',
  Fr = 'FR',
  Ga = 'GA',
  Gb = 'GB',
  Gd = 'GD',
  Ge = 'GE',
  Gf = 'GF',
  Gg = 'GG',
  Gh = 'GH',
  Gi = 'GI',
  Gl = 'GL',
  Gm = 'GM',
  Gn = 'GN',
  Gp = 'GP',
  Gq = 'GQ',
  Gr = 'GR',
  Gs = 'GS',
  Gt = 'GT',
  Gu = 'GU',
  Gw = 'GW',
  Gy = 'GY',
  Hk = 'HK',
  Hm = 'HM',
  Hn = 'HN',
  Hr = 'HR',
  Ht = 'HT',
  Hu = 'HU',
  Id = 'ID',
  Ie = 'IE',
  Im = 'IM',
  In = 'IN',
  Io = 'IO',
  Iq = 'IQ',
  Ir = 'IR',
  Is = 'IS',
  It = 'IT',
  Je = 'JE',
  Jm = 'JM',
  Jo = 'JO',
  Jp = 'JP',
  Ke = 'KE',
  Kg = 'KG',
  Kh = 'KH',
  Ki = 'KI',
  Km = 'KM',
  Kn = 'KN',
  Kp = 'KP',
  Kr = 'KR',
  Kw = 'KW',
  Ky = 'KY',
  Kz = 'KZ',
  La = 'LA',
  Lb = 'LB',
  Lc = 'LC',
  Li = 'LI',
  Lk = 'LK',
  Lr = 'LR',
  Ls = 'LS',
  Lt = 'LT',
  Lu = 'LU',
  Lv = 'LV',
  Ly = 'LY',
  Ma = 'MA',
  Mc = 'MC',
  Md = 'MD',
  Me = 'ME',
  Mf = 'MF',
  Mg = 'MG',
  Mh = 'MH',
  Mk = 'MK',
  Ml = 'ML',
  Mm = 'MM',
  Mn = 'MN',
  Mo = 'MO',
  Mp = 'MP',
  Mq = 'MQ',
  Mr = 'MR',
  Ms = 'MS',
  Mt = 'MT',
  Mu = 'MU',
  Mv = 'MV',
  Mw = 'MW',
  Mx = 'MX',
  My = 'MY',
  Mz = 'MZ',
  Na = 'NA',
  Nc = 'NC',
  Ne = 'NE',
  Nf = 'NF',
  Ng = 'NG',
  Ni = 'NI',
  Nl = 'NL',
  No = 'NO',
  Np = 'NP',
  Nr = 'NR',
  Nu = 'NU',
  Nz = 'NZ',
  Om = 'OM',
  Pa = 'PA',
  Pe = 'PE',
  Pf = 'PF',
  Pg = 'PG',
  Ph = 'PH',
  Pk = 'PK',
  Pl = 'PL',
  Pm = 'PM',
  Pn = 'PN',
  Pr = 'PR',
  Ps = 'PS',
  Pt = 'PT',
  Pw = 'PW',
  Py = 'PY',
  Qa = 'QA',
  Re = 'RE',
  Ro = 'RO',
  Rs = 'RS',
  Ru = 'RU',
  Rw = 'RW',
  Sa = 'SA',
  Sb = 'SB',
  Sc = 'SC',
  Sd = 'SD',
  Se = 'SE',
  Sg = 'SG',
  Sh = 'SH',
  Si = 'SI',
  Sj = 'SJ',
  Sk = 'SK',
  Sl = 'SL',
  Sm = 'SM',
  Sn = 'SN',
  So = 'SO',
  Sr = 'SR',
  Ss = 'SS',
  St = 'ST',
  Sv = 'SV',
  Sx = 'SX',
  Sy = 'SY',
  Sz = 'SZ',
  Tc = 'TC',
  Td = 'TD',
  Tf = 'TF',
  Tg = 'TG',
  Th = 'TH',
  Tj = 'TJ',
  Tk = 'TK',
  Tl = 'TL',
  Tm = 'TM',
  Tn = 'TN',
  To = 'TO',
  Tr = 'TR',
  Tv = 'TV',
  Tw = 'TW',
  Tz = 'TZ',
  Ua = 'UA',
  Ug = 'UG',
  Us = 'US',
  Uy = 'UY',
  Uz = 'UZ',
  Va = 'VA',
  Vc = 'VC',
  Ve = 'VE',
  Vg = 'VG',
  Vi = 'VI',
  Vn = 'VN',
  Vu = 'VU',
  Wf = 'WF',
  Ws = 'WS',
  Xk = 'XK',
  Ye = 'YE',
  Yt = 'YT',
  Za = 'ZA',
  Zm = 'ZM',
  Zw = 'ZW'
}

export type DirectoryInfo = StorageObject & {
  __typename?: 'DirectoryInfo';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  fileCount: Maybe<Scalars['Int']['output']>;
  folderCount: Maybe<Scalars['Int']['output']>;
  isFromBucket: Maybe<Scalars['Boolean']['output']>;
  isProtected: Maybe<Scalars['Boolean']['output']>;
  lastModified: Maybe<Scalars['DateTime']['output']>;
  name: Maybe<Scalars['String']['output']>;
  path: Scalars['String']['output'];
  permissions: Maybe<DirectoryPermissions>;
  protectChildren: Maybe<Scalars['Boolean']['output']>;
  totalSize: Maybe<Scalars['Int']['output']>;
};

export type DirectoryPermissions = {
  __typename?: 'DirectoryPermissions';
  allowCreateSubDirs: Maybe<Scalars['Boolean']['output']>;
  allowDelete: Maybe<Scalars['Boolean']['output']>;
  allowDeleteFiles: Maybe<Scalars['Boolean']['output']>;
  allowMove: Maybe<Scalars['Boolean']['output']>;
  allowMoveFiles: Maybe<Scalars['Boolean']['output']>;
  allowUploads: Maybe<Scalars['Boolean']['output']>;
};

export type DirectoryPermissionsInput = {
  allowCreateSubDirs: Scalars['Boolean']['input'];
  allowDelete: Scalars['Boolean']['input'];
  allowDeleteFiles: Scalars['Boolean']['input'];
  allowMove: Scalars['Boolean']['input'];
  allowMoveFiles: Scalars['Boolean']['input'];
  allowUploads: Scalars['Boolean']['input'];
};

export type DirectoryPermissionsUpdateInput = {
  path: Scalars['String']['input'];
  permissions: DirectoryPermissionsInput;
};

export type FileInfo = StorageObject & {
  __typename?: 'FileInfo';
  contentHash: Maybe<Scalars['String']['output']>;
  contentType: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  directoryPath: Maybe<Scalars['String']['output']>;
  fileType: Maybe<FileType>;
  isFromBucket: Maybe<Scalars['Boolean']['output']>;
  isInUse: Maybe<Scalars['Boolean']['output']>;
  isProtected: Maybe<Scalars['Boolean']['output']>;
  isPublic: Maybe<Scalars['Boolean']['output']>;
  lastModified: Maybe<Scalars['DateTime']['output']>;
  mediaLink: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  path: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  url: Scalars['String']['output'];
  usages: Maybe<Array<FileUsageInfo>>;
};

export type FileOperationResult = {
  __typename?: 'FileOperationResult';
  data: Maybe<StorageObject>;
  message: Maybe<Scalars['String']['output']>;
  success: Maybe<Scalars['Boolean']['output']>;
};

export type FileRenameInput = {
  currentPath: Scalars['String']['input'];
  newName: Scalars['String']['input'];
};

export enum FileSortField {
  Created = 'CREATED',
  Modified = 'MODIFIED',
  Name = 'NAME',
  Size = 'SIZE',
  Type = 'TYPE'
}

export enum FileType {
  Archive = 'ARCHIVE',
  Audio = 'AUDIO',
  Document = 'DOCUMENT',
  Font = 'FONT',
  Image = 'IMAGE',
  Other = 'OTHER',
  Video = 'VIDEO'
}

export type FileTypeBreakdown = {
  __typename?: 'FileTypeBreakdown';
  count: Maybe<Scalars['Int']['output']>;
  size: Maybe<Scalars['String']['output']>;
  type: Maybe<FileType>;
};

export type FileUsageCheckInput = {
  path: Scalars['String']['input'];
};

export type FileUsageInfo = {
  __typename?: 'FileUsageInfo';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  filePath: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  referenceId: Maybe<Scalars['String']['output']>;
  referenceTable: Maybe<Scalars['String']['output']>;
  usageType: Maybe<Scalars['String']['output']>;
};

export type FileUsageResult = {
  __typename?: 'FileUsageResult';
  canDelete: Maybe<Scalars['Boolean']['output']>;
  deleteBlockReason: Maybe<Scalars['String']['output']>;
  isInUse: Maybe<Scalars['Boolean']['output']>;
  usages: Maybe<Array<FileUsageInfo>>;
};

export type FilesListInput = {
  contentTypes: InputMaybe<Array<Scalars['String']['input']>>;
  fileType: InputMaybe<Scalars['String']['input']>;
  fileTypes: InputMaybe<Array<FileType>>;
  includeDirectories: InputMaybe<Scalars['Boolean']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  path: Scalars['String']['input'];
  searchTerm: InputMaybe<Scalars['String']['input']>;
  sortBy: InputMaybe<FileSortField>;
  sortDirection: InputMaybe<OrderSortDirection>;
};

export type FolderCreateInput = {
  path: Scalars['String']['input'];
  permissions: InputMaybe<DirectoryPermissionsInput>;
  protectChildren: InputMaybe<Scalars['Boolean']['input']>;
  protected: InputMaybe<Scalars['Boolean']['input']>;
};

export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE'
}

export type LoginInput = {
  email: Scalars['Email']['input'];
  password: Scalars['String']['input'];
};

export type LoginResponse = {
  __typename?: 'LoginResponse';
  token: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
};

export type Mutation = {
  __typename?: 'Mutation';
  copyStorageItems: Maybe<BulkOperationResult>;
  createFolder: Maybe<FileOperationResult>;
  deleteFile: Maybe<FileOperationResult>;
  deleteStorageItems: Maybe<BulkOperationResult>;
  deleteStudent: Maybe<Student>;
  login: Maybe<LoginResponse>;
  logout: Maybe<Scalars['Boolean']['output']>;
  moveStorageItems: Maybe<BulkOperationResult>;
  partiallyUpdateStudent: Maybe<Student>;
  prepareUpload: Maybe<UploadPreparation>;
  refreshToken: Maybe<RefreshTokenResponse>;
  renameFile: Maybe<FileOperationResult>;
  setStorageItemProtection: Maybe<FileOperationResult>;
  updateDirectoryPermissions: Maybe<FileOperationResult>;
};


export type MutationCopyStorageItemsArgs = {
  input: StorageItemsCopyInput;
};


export type MutationCreateFolderArgs = {
  input: FolderCreateInput;
};


export type MutationDeleteFileArgs = {
  path: Scalars['String']['input'];
};


export type MutationDeleteStorageItemsArgs = {
  input: StorageItemsDeleteInput;
};


export type MutationDeleteStudentArgs = {
  id: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationMoveStorageItemsArgs = {
  input: StorageItemsMoveInput;
};


export type MutationPartiallyUpdateStudentArgs = {
  input: PartialStudentUpdateInput;
};


export type MutationPrepareUploadArgs = {
  input: UploadPreparationInput;
};


export type MutationRenameFileArgs = {
  input: FileRenameInput;
};


export type MutationSetStorageItemProtectionArgs = {
  input: StorageItemProtectionUpdateInput;
};


export type MutationUpdateDirectoryPermissionsArgs = {
  input: DirectoryPermissionsUpdateInput;
};

export enum OrderSortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  count: Scalars['Int']['output'];
  currentPage: Scalars['Int']['output'];
  endCursor: Maybe<Scalars['String']['output']>;
  firstItem: Maybe<Scalars['Int']['output']>;
  hasMorePages: Scalars['Boolean']['output'];
  lastItem: Maybe<Scalars['Int']['output']>;
  lastPage: Scalars['Int']['output'];
  perPage: Scalars['Int']['output'];
  startCursor: Maybe<Scalars['String']['output']>;
  total: Scalars['Int']['output'];
};

export type PaginationArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  maxCount: InputMaybe<Scalars['Int']['input']>;
  page: InputMaybe<Scalars['Int']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
};

export type PartialStudentUpdateInput = {
  classesRemaining: InputMaybe<Scalars['Int']['input']>;
  classesTotal: InputMaybe<Scalars['Int']['input']>;
  dateOfBirth: InputMaybe<Scalars['DateTime']['input']>;
  gender: InputMaybe<Gender>;
  id: Scalars['String']['input'];
  language: InputMaybe<AppLanguage>;
  name: InputMaybe<Scalars['String']['input']>;
  parentId: InputMaybe<Scalars['String']['input']>;
  primaryTeacherId: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<StudentStatus>;
};

export type Query = {
  __typename?: 'Query';
  directoryChildren: Maybe<Array<DirectoryInfo>>;
  fileInfo: Maybe<FileInfo>;
  fileUsage: Maybe<FileUsageResult>;
  folderInfo: Maybe<DirectoryInfo>;
  listFiles: Maybe<StorageObjectList>;
  me: Maybe<User>;
  searchFiles: Maybe<StorageObjectList>;
  storageStats: Maybe<StorageStats>;
  student: Maybe<Student>;
  students: StudentsWithFiltersResponse;
  translatedMessage: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  users: Maybe<Array<User>>;
  welcomeMessage: Maybe<Scalars['String']['output']>;
};


export type QueryDirectoryChildrenArgs = {
  path: InputMaybe<Scalars['String']['input']>;
};


export type QueryFileInfoArgs = {
  path: Scalars['String']['input'];
};


export type QueryFileUsageArgs = {
  input: FileUsageCheckInput;
};


export type QueryFolderInfoArgs = {
  path: Scalars['String']['input'];
};


export type QueryListFilesArgs = {
  input: FilesListInput;
};


export type QuerySearchFilesArgs = {
  fileType: InputMaybe<Scalars['String']['input']>;
  folder: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  searchTerm: Scalars['String']['input'];
};


export type QueryStorageStatsArgs = {
  path: InputMaybe<Scalars['String']['input']>;
};


export type QueryStudentArgs = {
  id: Scalars['String']['input'];
};


export type QueryStudentsArgs = {
  filterArgs: InputMaybe<StudentFilterArgs>;
  orderBy: InputMaybe<Array<StudentsOrderByClause>>;
  paginationArgs: InputMaybe<PaginationArgs>;
};


export type QueryTranslatedMessageArgs = {
  key: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
};

export type RefreshTokenResponse = {
  __typename?: 'RefreshTokenResponse';
  token: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
};

export type StorageItemProtectionUpdateInput = {
  isProtected: Scalars['Boolean']['input'];
  path: Scalars['String']['input'];
  protectChildren: InputMaybe<Scalars['Boolean']['input']>;
};

export type StorageItemsCopyInput = {
  destinationPath: Scalars['String']['input'];
  sourcePaths: Array<Scalars['String']['input']>;
};

export type StorageItemsDeleteInput = {
  force: InputMaybe<Scalars['Boolean']['input']>;
  paths: Array<Scalars['String']['input']>;
};

export type StorageItemsMoveInput = {
  destinationPath: Scalars['String']['input'];
  sourcePaths: Array<Scalars['String']['input']>;
};

export type StorageObject = {
  isProtected: Maybe<Scalars['Boolean']['output']>;
  name: Maybe<Scalars['String']['output']>;
  path: Scalars['String']['output'];
};

export type StorageObjectList = {
  __typename?: 'StorageObjectList';
  hasMore: Scalars['Boolean']['output'];
  items: Maybe<Array<StorageObject>>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type StorageStats = {
  __typename?: 'StorageStats';
  directoryCount: Maybe<Scalars['Int']['output']>;
  fileTypeBreakdown: Maybe<Array<FileTypeBreakdown>>;
  totalFiles: Maybe<Scalars['Int']['output']>;
  totalSize: Maybe<Scalars['String']['output']>;
};

export type Student = {
  __typename?: 'Student';
  classesRemaining: Scalars['Int']['output'];
  classesTotal: Scalars['Int']['output'];
  createdAt: Maybe<Scalars['DateTime']['output']>;
  dateOfBirth: Maybe<Scalars['DateTime']['output']>;
  gender: Maybe<Gender>;
  id: Scalars['String']['output'];
  language: Maybe<AppLanguage>;
  name: Scalars['String']['output'];
  parentId: Scalars['String']['output'];
  primaryTeacherId: Maybe<Scalars['String']['output']>;
  status: StudentStatus;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type StudentCreateInput = {
  classesRemaining: InputMaybe<Scalars['Int']['input']>;
  classesTotal: InputMaybe<Scalars['Int']['input']>;
  dateOfBirth: InputMaybe<Scalars['DateTime']['input']>;
  gender: InputMaybe<Gender>;
  idempotencyKey: Scalars['String']['input'];
  language: InputMaybe<AppLanguage>;
  name: Scalars['String']['input'];
  parentId: Scalars['String']['input'];
  primaryTeacherId: InputMaybe<Scalars['String']['input']>;
  status: StudentStatus;
};

export type StudentFilterArgs = {
  birthDate: InputMaybe<Scalars['DateTime']['input']>;
  birthDateAfter: InputMaybe<Scalars['DateTime']['input']>;
  birthDateBefore: InputMaybe<Scalars['DateTime']['input']>;
  birthDateFrom: InputMaybe<Scalars['DateTime']['input']>;
  birthDateIsEmpty: InputMaybe<Scalars['Boolean']['input']>;
  birthDateIsNotEmpty: InputMaybe<Scalars['Boolean']['input']>;
  birthDateNot: InputMaybe<Scalars['DateTime']['input']>;
  birthDateOnOrAfter: InputMaybe<Scalars['DateTime']['input']>;
  birthDateOnOrBefore: InputMaybe<Scalars['DateTime']['input']>;
  birthDateTo: InputMaybe<Scalars['DateTime']['input']>;
  createdAt: InputMaybe<Scalars['DateTime']['input']>;
  createdAtAfter: InputMaybe<Scalars['DateTime']['input']>;
  createdAtBefore: InputMaybe<Scalars['DateTime']['input']>;
  createdAtFrom: InputMaybe<Scalars['DateTime']['input']>;
  createdAtIsEmpty: InputMaybe<Scalars['Boolean']['input']>;
  createdAtIsNotEmpty: InputMaybe<Scalars['Boolean']['input']>;
  createdAtNot: InputMaybe<Scalars['DateTime']['input']>;
  createdAtOnOrAfter: InputMaybe<Scalars['DateTime']['input']>;
  createdAtOnOrBefore: InputMaybe<Scalars['DateTime']['input']>;
  createdAtTo: InputMaybe<Scalars['DateTime']['input']>;
  gender: InputMaybe<Gender>;
  language: InputMaybe<AppLanguage>;
  name: InputMaybe<Scalars['String']['input']>;
  nameEndsWith: InputMaybe<Scalars['String']['input']>;
  nameEquals: InputMaybe<Scalars['String']['input']>;
  nameIsEmpty: InputMaybe<Scalars['Boolean']['input']>;
  nameIsNotEmpty: InputMaybe<Scalars['Boolean']['input']>;
  nameNotContains: InputMaybe<Scalars['String']['input']>;
  nameNotEquals: InputMaybe<Scalars['String']['input']>;
  nameStartsWith: InputMaybe<Scalars['String']['input']>;
  parentId: InputMaybe<Scalars['String']['input']>;
  primaryTeacherId: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<StudentStatus>;
};

export enum StudentStatus {
  Deactivated = 'DEACTIVATED',
  Graduated = 'GRADUATED',
  OnLeave = 'ON_LEAVE',
  OnTrial = 'ON_TRIAL',
  Regular = 'REGULAR',
  Suspended = 'SUSPENDED'
}

export type StudentsOrderByClause = {
  column: StudentsOrderByColumn;
  order: InputMaybe<OrderSortDirection>;
};

export enum StudentsOrderByColumn {
  ClassesRemaining = 'CLASSES_REMAINING',
  ClassesTotal = 'CLASSES_TOTAL',
  CreatedAt = 'CREATED_AT',
  DateOfBirth = 'DATE_OF_BIRTH',
  Gender = 'GENDER',
  Id = 'ID',
  Name = 'NAME',
  ParentId = 'PARENT_ID',
  Status = 'STATUS',
  UpdatedAt = 'UPDATED_AT'
}

export type StudentsWithFiltersResponse = {
  __typename?: 'StudentsWithFiltersResponse';
  data: Array<Student>;
  pageInfo: PageInfo;
};

export type UploadPreparation = {
  __typename?: 'UploadPreparation';
  id: Scalars['String']['output'];
  uploadType: UploadType;
  url: Scalars['String']['output'];
};

export type UploadPreparationInput = {
  contentHash: Scalars['String']['input'];
  contentType: Scalars['String']['input'];
  fileSize: Scalars['Int']['input'];
  path: Scalars['String']['input'];
};

export enum UploadType {
  SignedUrl = 'SIGNED_URL',
  VercelBlobClient = 'VERCEL_BLOB_CLIENT'
}

export type User = {
  __typename?: 'User';
  createdAt: Maybe<Scalars['DateTime']['output']>;
  email: Maybe<Scalars['String']['output']>;
  emailVerifiedAt: Maybe<Scalars['DateTime']['output']>;
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};
