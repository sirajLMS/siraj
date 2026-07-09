#!/usr/bin/env perl
use strict;
use warnings;

my $alias = $ENV{ALIAS_PREFIX} || "@/";

# Read entire file
local $/;
my $content = <STDIN>;

# Fix already-broken @/ imports on new line
# import { X } from\n'@/path' -> import { X } from '@/path'
$content =~ s/from\s*[\n\r\s]*['"](\@\/[^'"]+)['"]/from '$1'/gs;

# Handle multiline import with FROM keyword (including newlines and spaces)
$content =~ s/from\s*[\n\r\s]*["']\.\//from '$alias\//gs;
$content =~ s/from\s*[\n\r\s]*["']\.\.\//from '$alias\//gs;

# Handle single-line from
$content =~ s/from\s+["']\.\//from '$alias\//g;
$content =~ s/from\s+["']\.\.\//from '$alias\//g;

# Handle import() with multiline
$content =~ s/import\s*\(\s*["']\.\//import('$alias\//g;
$content =~ s/import\s*\(\s*["']\.\.\//import('$alias\//g;

# Handle multiline import path (e.g., import\n'./...')
$content =~ s/import\s*[\n\r\s]*["']\.\//import('$alias\//gs;
$content =~ s/import\s*[\n\r\s]*["']\.\.\//import('$alias\//gs;

# Handle case where path is on new line without from/import keyword
# (just a string on its own line starting with ./ or ../)
$content =~ s/^\s*["']\.\//'$alias\//gms;
$content =~ s/^\s*["']\.\.\//'$alias\//gms;

print $content;