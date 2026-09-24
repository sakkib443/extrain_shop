/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FiShoppingCart, FiChevronDown, FiMenu, FiX,
    FiUser, FiHeart, FiPhone, FiLogOut,
    FiGrid, FiBox, FiMapPin, FiGlobe,
} from 'react-icons/fi';
import { useAppSelector, useAppDispatch } from '@/redux';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { logout } from '@/redux/slices/authSlice';
import Logo from '@/components/shared/Logo';
import { useTheme } from '@/components/shared/ThemeProvider';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';
import { useWishlist } from '@/hooks/useWishlist';
import { telHref } from '@/utils/contactLinks';
import { homeFor, isStaffRole } from '@/components/admin/access';

interface Category {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
    image?: string;
}

const isCatImg = (c: Category) => Boolean(c.image || (c.icon && (c.icon.startsWith('http') || c.icon.startsWith('/'))));
const getCatImg = (c: Category) => c.image || c.icon || '';

const FALLBACK_CATEGORIES: Category[] = [
    { _id: 'f-cookware', name: 'Cookware', slug: 'cookware', icon: '🍳', image: '/categories/cookware.webp' },
    { _id: 'f-dinnerware', name: 'Dinnerware', slug: 'dinnerware', icon: '🍽️', image: '/categories/dinnerware.webp' },
    { _id: 'f-kitchen-tools', name: 'Kitchen Tools', slug: 'kitchen-tools', icon: '🔪', image: '/categories/kitchen-tools.webp' },
    { _id: 'f-food-storage', name: 'Food Storage', slug: 'food-storage', icon: '🫙', image: '/categories/food-storage.webp' },
    { _id: 'f-appliances', name: 'Appliances', slug: 'appliances', icon: '⚡', image: '/categories/appliances.webp' },
    { _id: 'f-bakeware', name: 'Bakeware', slug: 'bakeware', icon: '🧁', image: '/categories/bakeware.webp' },
    { _id: 'f-drinkware', name: 'Drinkware', slug: 'drinkware', icon: '🥤', image: '/categories/drinkware.webp' },
    { _id: 'f-cutlery', name: 'Cutlery', slug: 'cutlery', icon: '🍴', image: '/categories/cutlery.webp' },
];

/** Row 2 — the four quick links that sit between the logo and the search field. */
const PRIMARY_LINKS: { href: string; label: string; highlight?: boolean }[] = [
    { href: '/shop', label: 'Shop' },
    { href: '/services', label: 'Services' },
    { href: '/products?sort=discount', label: 'Offer', highlight: true },
    { href: '/ship-for-me', label: 'Ship For Me' },
];

/** Row 4 — the announcement ticker. Edit this list to change what scrolls. */
const TICKER: string[] = [
    '🔥 Fresh stock in — same-day dispatch inside Dhaka',
    '💥 Pay in 3 instalments on bKash — 0% interest',
    '🚚 Free delivery on every order above ৳3,000',
    '📦 7-day easy return, no questions asked',
    '📍 Cash on delivery available nationwide',
];

const Header: React.FC = () => {

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchCatOpen, setIsSearchCatOpen] = useState(false);
    const [selectedSearchCat, setSelectedSearchCat] = useState<Category | null>(null);
    const [isExploreOpen, setIsExploreOpen] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    const searchCatRef = useRef<HTMLDivElement>(null);
    const mobileSearchCatRef = useRef<HTMLDivElement>(null);
    const exploreRef = useRef<HTMLDivElement>(null);

    const cartItems = useAppSelector((state) => state.cart.items);
    const { count: wishlistCount } = useWishlist();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();

    const wishlistHref = '/wishlist';

    const { data: categoriesData } = useGetCategoriesQuery({});
    const categories: Category[] = categoriesData?.data?.length > 0 ? categoriesData.data : FALLBACK_CATEGORIES;
    const { data: siteContentRes } = useGetSiteContentQuery(undefined);
    const contact = siteContentRes?.data?.contact || {};
    const contactPhoneHref = telHref(contact.phone);

    /** The category bar shows the first eight; the rest live under EXPLORE ALL. */
    const barCategories = categories.slice(0, 8);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
            const inDesktop = searchCatRef.current && searchCatRef.current.contains(e.target as Node);
            const inMobile = mobileSearchCatRef.current && mobileSearchCatRef.current.contains(e.target as Node);
            if (!inDesktop && !inMobile) setIsSearchCatOpen(false);
            if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setIsExploreOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        setIsProfileOpen(false);
        router.push('/');
    };

    const handleSearch = (rawTerm?: string) => {
        const trimmed = (rawTerm ?? searchQuery).trim();
        if (!trimmed && !selectedSearchCat) return;
        const params = new URLSearchParams();
        if (trimmed) params.set('q', trimmed);
        if (selectedSearchCat) params.set('category', selectedSearchCat._id);
        router.push(`/products?${params.toString()}`);
    };

    /* ── Shared bits ─────────────────────────────────────────────────── */

    /** The 54×54 rounded-square that the action icons sit in. */
    const iconBtn = "w-[54px] h-[54px] rounded-[12px] flex items-center justify-center transition-all duration-200 shrink-0";

    const renderCategorySelector = (isMobile: boolean) => (
        <div className="relative shrink-0" ref={isMobile ? mobileSearchCatRef : searchCatRef}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsSearchCatOpen((prev) => !prev); }}
                className={`flex items-center gap-1.5 ${isMobile ? 'ml-1 px-2 h-[32px] text-xs' : 'ml-1 px-2.5 h-[36px] text-[13px]'
                    } font-semibold whitespace-nowrap transition-colors rounded-lg cursor-pointer select-none`}
                style={{ background: 'var(--color-soft)', border: '1px solid var(--color-soft-border)', color: 'var(--color-text-primary)' }}
                title="Select category to filter"
            >
                <FiGlobe size={13} strokeWidth={2} style={{ color: 'var(--hd-gold-deep)' }} className="shrink-0" />
                <span className={isMobile ? 'max-w-[62px] truncate' : 'max-w-[90px] truncate'}>
                    {selectedSearchCat ? selectedSearchCat.name : 'All'}
                </span>
                <FiChevronDown size={12} strokeWidth={2.5}
                    className={`transition-transform duration-200 shrink-0 text-gray-500 ${isSearchCatOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSearchCatOpen && (
                <div className={`absolute top-full left-0 mt-2 ${isMobile ? 'w-60 max-w-[85vw]' : 'w-64'} bg-white rounded-2xl border border-gray-100 z-[100] max-h-80 overflow-y-auto p-1.5 animate-fadeIn`}
                    style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)' }}>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 mb-1">
                        Filter by Category
                    </div>
                    <button type="button"
                        onClick={() => { setSelectedSearchCat(null); setIsSearchCatOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${!selectedSearchCat ? 'bg-[var(--hd-gold-soft)] font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <span className="flex items-center gap-2"><span>🛒</span> All Categories</span>
                        {!selectedSearchCat && <span className="text-xs font-bold" style={{ color: 'var(--hd-gold-deep)' }}>✓</span>}
                    </button>
                    {categories.map((cat) => {
                        const isSelected = selectedSearchCat?._id === cat._id;
                        return (
                            <button key={cat._id} type="button"
                                onClick={() => { setSelectedSearchCat(cat); setIsSearchCatOpen(false); }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${isSelected ? 'bg-[var(--hd-gold-soft)] font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <span className="flex items-center gap-2 truncate pr-2"><span className="truncate">{cat.name}</span></span>
                                {isSelected && <span className="text-xs font-bold shrink-0" style={{ color: 'var(--hd-gold-deep)' }}>✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const cartBadge = (
        <span className="absolute -top-1 -right-1 text-white text-[9px] min-w-[17px] h-[17px] px-0.5 rounded-full flex items-center justify-center font-bold ring-2 ring-white"
            style={{ background: 'var(--color-sale)' }}>
            {cartItems.length > 99 ? '99+' : cartItems.length}
        </span>
    );

    return (
        <header className="dz-header w-full sticky top-0 z-[60] lg:static bg-white rounded-b-[20px] lg:rounded-none lg:px-4 transition-colors duration-300">

            {/* ═══════════ 1 · UTILITY BAR ═══════════
                Hairline strip of secondary links. Hidden below md, exactly as the
                reference does — on a phone this row is pure noise. */}
            <div className="hidden md:block">
                <div className="max-w-[1420px] mx-auto py-2 px-12 rounded-b-[10px] flex items-center justify-between bg-white">

                    <nav className="flex items-center gap-6">
                        {[{ href: '/expert', label: 'Expert Advice' }, { href: '/cost-calculator', label: 'Cost Calculator' }].map(l => (
                            <Link key={l.href} href={l.href}
                                className="text-xs font-medium transition-[filter] hover:brightness-110 bg-clip-text text-transparent"
                                style={{ backgroundImage: 'linear-gradient(to right, var(--color-text-primary), var(--hd-gold-deep))' }}>
                                {l.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-6">
                        {contactPhoneHref && contact.phone && (
                            <a href={contactPhoneHref} className="flex items-center gap-2 text-xs text-[#222] hover:text-black transition-colors">
                                <FiPhone size={13} strokeWidth={2} />
                                <span>{contact.phone}</span>
                            </a>
                        )}
                        <Link href="/track" className="flex items-center gap-2 text-xs text-[#222] hover:text-black transition-colors">
                            <FiMapPin size={13} strokeWidth={2} />
                            <span>Track Order</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ═══════════ 2 · MAIN BAR ═══════════
                Logo · quick links · search (takes the slack) · action squares. */}
            <div className="border-b border-black/5">
                <div className="max-w-[1400px] mx-auto lg:px-9 px-4">

                    <div className="hidden md:flex items-center gap-6 py-4">

                        <Link href="/" className="shrink-0 mr-2" onClick={() => setSearchQuery('')}>
                            <HeaderLogo />
                        </Link>

                        <nav className="hidden lg:flex items-center gap-1">
                            {PRIMARY_LINKS.map(l => (
                                <Link key={l.href} href={l.href}
                                    className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${l.highlight
                                        ? 'border text-[#222]'
                                        : 'text-gray-600 hover:text-black hover:bg-black/5'}`}
                                    style={l.highlight
                                        ? { borderColor: 'var(--hd-gold-line)', background: 'var(--hd-gold-soft)' }
                                        : undefined}>
                                    {l.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="flex-1 relative">
                            <SearchAutocomplete
                                variant="desktop"
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onSubmit={(term) => handleSearch(term)}
                                placeholder="Search for the item"
                                leading={renderCategorySelector(false)}
                            />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">

                            {/* Account — dropdown when signed in, straight to /login when not */}
                            {isAuthenticated && user ? (
                                <div className="relative" ref={profileRef}>
                                    <button onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className={`${iconBtn} bg-[var(--color-soft)] hover:bg-black/5 cursor-pointer`}
                                        aria-label="Account">
                                        {user.avatar
                                            ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                                            : <FiUser size={22} strokeWidth={1.7} className="text-[#222]" />}
                                    </button>

                                    {isProfileOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-gray-100 overflow-hidden z-[100] animate-fadeIn"
                                            style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.18)' }}>
                                            <div className="px-4 py-3.5 border-b border-gray-100" style={{ background: 'var(--hd-gold-soft)' }}>
                                                <p className="text-sm font-bold text-gray-800 truncate">{user.name || 'User'}</p>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                                            </div>
                                            <div className="py-1.5">
                                                {[
                                                    { href: isStaffRole(user.role) ? homeFor(user.role) : '/dashboard/user', icon: <FiGrid size={15} />, label: 'Dashboard' },
                                                    ...(isStaffRole(user.role) ? [] : [{ href: '/dashboard/user/orders', icon: <FiBox size={15} />, label: 'My Orders' }]),
                                                    { href: wishlistHref, icon: <FiHeart size={15} />, label: `Wishlist${wishlistCount ? ` (${wishlistCount})` : ''}` },
                                                ].map(item => (
                                                    <Link key={item.href} href={item.href} onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                        {item.icon} {item.label}
                                                    </Link>
                                                ))}
                                            </div>
                                            <div className="border-t border-gray-100 py-1.5">
                                                <button onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                                                    <FiLogOut size={15} /> Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link href="/login" className={`${iconBtn} bg-[var(--color-soft)] hover:bg-black/5`} aria-label="Sign in">
                                    <FiUser size={22} strokeWidth={1.7} className="text-[#222]" />
                                </Link>
                            )}

                            <Link href="/cart" className={`${iconBtn} bg-[var(--color-soft)] hover:bg-black/5 relative`} aria-label="Cart">
                                <FiShoppingCart size={21} strokeWidth={1.8} className="text-[#222]" />
                                {cartBadge}
                            </Link>

                            {/* The reference puts a theme toggle in this gold square. There is no
                                dark mode to toggle here — useTheme() carries store branding, not a
                                colour scheme — so the slot holds the wishlist instead. */}
                            <Link href={wishlistHref} className={`${iconBtn} cursor-pointer hover:brightness-95 relative`}
                                style={{ background: 'var(--hd-gold-soft)' }} aria-label="Wishlist">
                                <FiHeart size={21} strokeWidth={1.8} style={{ color: 'var(--hd-gold-deep)' }} />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-1 -right-1 text-white text-[9px] min-w-[17px] h-[17px] px-0.5 rounded-full flex items-center justify-center font-bold ring-2 ring-white"
                                        style={{ background: 'var(--hd-gold-deep)' }}>
                                        {wishlistCount > 99 ? '99+' : wishlistCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>

                    {/* ── Mobile bar ──────────────────────────────────────────────
                        A dark slab with a rounded underside, the way the reference
                        does it — the white action squares and the search field read
                        as cut-outs in it, and the whole thing stays put while the
                        page scrolls (the header is sticky below lg). */}
                    <div className="md:hidden py-3 -mx-4 px-4 rounded-b-[20px]" style={{ background: 'var(--hd-dark)' }}>
                        <div className="flex items-center justify-between gap-3">
                            <Link href="/" className="shrink-0" onClick={() => setSearchQuery('')}>
                                <HeaderLogo light height={30} maxWidth={150} />
                            </Link>
                            <div className="flex items-center gap-2">
                                <Link href={wishlistHref} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'var(--hd-gold)' }} aria-label="Wishlist">
                                    <FiHeart size={18} className="text-gray-900" />
                                </Link>
                                <Link href="/track" className="w-11 h-11 rounded-xl flex items-center justify-center bg-white shrink-0" aria-label="Track order">
                                    <FiMapPin size={18} className="text-[#222]" />
                                </Link>
                                <Link href="/cart" className="w-11 h-11 rounded-xl flex items-center justify-center bg-white relative shrink-0" aria-label="Cart">
                                    <FiShoppingCart size={18} className="text-[#222]" />
                                    {cartBadge}
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                            <div className="flex-1 min-w-0">
                                <SearchAutocomplete
                                    variant="mobile"
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    onSubmit={(term) => handleSearch(term)}
                                    placeholder="Search for the item"
                                />
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0"
                                aria-label="Menu">
                                {isMobileMenuOpen ? <FiX size={20} className="text-[#222]" /> : <FiMenu size={20} className="text-[#222]" />}
                            </button>
                        </div>

                        {isMobileMenuOpen && (
                            <div className="bg-white rounded-2xl p-2 mt-3 max-h-[60vh] overflow-y-auto">
                                <button onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-gray-800 font-semibold text-sm rounded-lg hover:bg-gray-50">
                                    <span>Categories</span>
                                    <FiChevronDown size={14} className={`transition-transform ${isMobileCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isMobileCategoryOpen && (
                                    <div className="pl-3 space-y-0.5">
                                        <Link href="/products" onClick={() => setIsMobileMenuOpen(false)}
                                            className="block px-3 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-50">🛒 All Products</Link>
                                        {categories.map(cat => (
                                            <Link key={cat._id} href={`/products?category=${cat._id}`} onClick={() => setIsMobileMenuOpen(false)}
                                                className="flex items-center gap-2 px-3 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                                                {isCatImg(cat)
                                                    ? <img src={getCatImg(cat)} alt="" className="w-4 h-4 object-contain rounded-xs shrink-0" />
                                                    : cat.icon && <span className="text-sm shrink-0">{cat.icon}</span>}
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {[...PRIMARY_LINKS.map(l => ({ href: l.href, label: l.label })),
                                { href: '/track', label: 'Track Order' },
                                { href: '/contact', label: 'Help & Support' },
                                { href: wishlistHref, label: 'Wishlist' },
                                ].map(item => (
                                    <Link key={item.label} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════ 3 · CATEGORY BAR ═══════════
                EXPLORE ALL holds the full list; the rail beside it carries the
                first eight so the common ones are one click away. lg and up only. */}
            <div className="relative w-full hidden lg:flex">
                <div className="flex flex-col flex-1 items-center max-w-[1344px] mx-auto px-2">
                    <div className="flex items-center gap-3 py-2.5 w-full">

                        <div className="relative shrink-0" ref={exploreRef}>
                            <button type="button" onClick={() => setIsExploreOpen(p => !p)}
                                className="flex items-center gap-2 text-gray-900 font-bold text-[12.5px] tracking-wide px-[18px] py-[14px] rounded-[9px] transition-colors cursor-pointer"
                                style={{ background: 'var(--hd-gold)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hd-gold-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'var(--hd-gold)')}>
                                EXPLORE ALL
                                <FiChevronDown size={14} strokeWidth={2.5}
                                    className={`transition-transform duration-200 ${isExploreOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isExploreOpen && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl border border-gray-100 z-[100] max-h-[70vh] overflow-y-auto p-1.5 animate-fadeIn"
                                    style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.18)' }}>
                                    <Link href="/products" onClick={() => setIsExploreOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold transition-colors hover:bg-gray-50"
                                        style={{ color: 'var(--hd-gold-deep)' }}>
                                        <FiGrid size={15} /> All Products
                                    </Link>
                                    <div className="my-1 border-t border-gray-100" />
                                    {categories.map(cat => (
                                        <Link key={cat._id} href={`/products?category=${cat._id}`} onClick={() => setIsExploreOpen(false)}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                                            {isCatImg(cat)
                                                ? <img src={getCatImg(cat)} alt="" className="w-5 h-5 object-contain rounded shrink-0" />
                                                : cat.icon && <span className="text-base shrink-0">{cat.icon}</span>}
                                            <span className="truncate">{cat.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-px h-6 bg-gray-200 shrink-0" />

                        <nav className="flex items-center justify-between rounded-lg flex-1 bg-white py-1.5 px-5 relative z-[99] overflow-hidden">
                            {barCategories.map(cat => (
                                <Link key={cat._id} href={`/products?category=${cat._id}`}
                                    className="flex items-center gap-1 text-[13.5px] font-medium text-[#222] hover:text-black transition-colors whitespace-nowrap px-1">
                                    <span className="truncate max-w-[110px]">{cat.name}</span>
                                    <FiChevronDown size={13} strokeWidth={2.5} className="text-gray-400 shrink-0" />
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* ═══════════ 4 · ANNOUNCEMENT TICKER ═══════════
                The list is rendered twice and the track slides exactly -50%, so the
                second copy is under the cursor the moment the first runs out and the
                loop never shows a seam. Pauses on hover; see globals.css. */}
            <div className="relative w-full overflow-hidden select-none py-3">
                <div className="flex items-center marquee-track w-max">
                    {[...TICKER, ...TICKER].map((item, i) => (
                        <span key={i}
                            className="flex items-center gap-2 px-8 whitespace-nowrap shrink-0 justify-center border-r border-black/10 text-[13px] text-[#222]">
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </header>
    );
};

// The logo and its height come from Settings → Store. With no logo uploaded, the
// built-in one is drawn at that height instead.
function HeaderLogo({ light = false, height, maxWidth = 260 }: { light?: boolean; height?: number; maxWidth?: number }) {
    const { logoUrl, logoHeight } = useTheme();
    const uploaded = logoUrl && logoUrl !== '/logo.svg';
    // The wordmark is ~4.8× as wide as it is tall, so on a 375px phone the full
    // height would leave no room for the three action squares beside it.
    const size = height ?? logoHeight;
    return (
        <div className="group select-none transition-transform duration-300 hover:scale-105">
            {uploaded
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logoUrl} alt="Store" style={{ height: size, width: 'auto', maxWidth }} className="block object-contain" />
                : <Logo size={size} light={light} />}
        </div>
    );
}

export default Header;
