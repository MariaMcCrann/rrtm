#!/usr/bin/python

# RRTM Reference:
# Mlawer, E.J., S.J. Taubman, P.D. Brown,  M.J. Iacono and 
# S.A. Clough: RRTM, a validated correlated-k model for the 
# longwave. J. Geophys. Res., 102, 16,663-16,682, 1997         

# Gotta have this to let the server know it's json
print "Content-type: application/json\n\n";

import json, sys, re, os, climt
from numpy import e, linspace, log
from subprocess import call
from os import rename, chdir
from math import copysign, floor, log10
import numpy

json_input = json.load(sys.stdin)
sys.stderr.write(str(json_input))
r = climt.radiation(scheme='rrtm')
r(**json_input)

# In case it's needed:
def sigdig(x, digits=1):
    if x:
        x = copysign(round(x, -int(floor(log10(abs(x)))) + (digits - 1)), x)
    return x

sys.stderr.write(str(float(r['SwToa'])))

response = json.dumps({
    'LwToa': sigdig(float(r['LwToa']), 3),
    'SwToa': sigdig(float(r['SwToa']), 3),
    'net_toa': sigdig(float(r['LwToa']) + float(r['SwToa']), 3)
})
sys.stderr.write(response)

print response

# MOLECULES = [None,
#     'H2O', 'CO2', 'O3', 'N2O', 'CO', 'CH4', 'O2', 'NO', 'SO2', 'NO2', # 1 - 10
#     'NH3', 'HNO3', 'OH', 'HF', 'HCL', 'HBR', 'HI', 'CLO', 'OCS', # 11 - 20
#     'H2CO', 'HOCL', 'N2', 'HCN', 'CH3CL', 'H2O2', 'C2H2', 'C2H6', 'PH3', 'COF2', 'SF6', # 21 - 30
#     'H2S', 'HCOOH' # 31 - 32
# ]
# 
# def make_input_files(atmosphere_name = 'midlatitude_summer'):
#     # if the passed file is one of the profiles specified 
#     if atmosphere_name + '.json' in os.listdir('atmospheres'):
#         atmosphere = load_atmosphere(atmosphere_name) # see method below        
#     else:
#         atmosphere = json.loads(atmosphere_name)
#     
#     # create temporary file
#     f_sw = open('sw/INPUT_RRTM', 'w')
#     f_lw = open('lw/INPUT_RRTM', 'w')
#     
#     # RECORD 1.1
#     
#     # marks the beginning of the file
#     f_sw.write('$\n')
#     f_lw.write('$\n')
#     
#     # RECORD 1.2
#     # sw
#     
#     aerosol = False # want aerosols with that?
#     iatm = False # will you be using ray tracing?
#     istrm = '0' # how many streams would you like, 4 (put 0), 8 (put 1), or 16 (put 2)?
#     iout = False # would you like the results for each band individually, and if so which ones?
#     icloud = False # want clouds with that?
#     idelm = False # compute direct and diffuse downwelling fluxes using delta-M approximation?
#     icos = False # account for instrumental cosine response?
#     
#     aerosol_flag = '10' if aerosol else ' 0'
#     
#     f_sw.write(' ' * 18 + aerosol_flag + ' ' * 29 + str(int(iatm)) + \
#         ' ' * 32 + '0 ' + istrm + '  ' + str(int(iout)).rjust(3) + \
#         ' ' * 4 + str(int(icloud)) + ' ' * 3 + str(int(idelm)) + str(int(icos)) + '\n')
#     
#     # lw
#     
#     ixsect = False # do you want to use cross-sections?
#     iscat = 0 # which radiative transfer solver would you like to use? 0 == RRTM
#     numangs = 3 # NUMANGS: using Gaussian quadrature, how many angles do you want to compute over?
#     
#     f_lw.write(' ' * 50 + str(int(iatm)) + ' ' * 19 + str(int(ixsect)) + ' ' * 12 + \
#         str(iscat) + str(numangs).rjust(2) + '  ' + str(int(iout)).rjust(3) + ' ' * 4 + str(int(icloud)) + '\n')
#     
#     # RECORD 1.2.1
#     julday = False # do want to specify a julian day of the calendar to estimate distance from sun? (if yes, just put the number)
#     
#     sza = 65.0 # solar zenith angle; 0 = overhead
#     
#     isolvar = False # do you want to use special solar variability functions for different bands? 1 signifies to use the first value of isolvars for all bands, 2 signifies mapping isolvars onto respective bands
#     
#     isolvars = [] # if isolvar is not false, put 1 or 14 values (e.g. 0.945) by which to weight the direct beam in different wavenumber bands
#     
#     f_sw.write(' ' * 12 + str(int(julday)).rjust(3) + ' ' * 3 + '%7.4F' % sza + ' ' * 4 + \
#         str(int(isolvar)) + ''.join(['%5.3F' % i for i in isolvars]) + '\n')
#     
#     # RECORD 1.4
#     
#     iemis = False # do you want different amounts of surface emissivity (which are used to compute reflectance, e.g. albedo) for each band? 1 signifies to use the first value of semiss for all bands, 2 signifies mapping semiss onto respective bands
#     
#     ireflect = False # do you want specular reflectance (as opposed to isotropic reflectance?)
#     
#     semiss_sw = [] # if iemis is not false, put 1 or 14 values (e.g. 0.945) by which to weight the emissivity (1 - reflectance) in different wavenumber bands
#     
#     f_sw.write(' ' * 11 + str(int(iemis)) + '  ' + str(int(ireflect)) + \
#         ''.join(['%5.3F' % i for i in semiss_sw]) + '\n')
#     
#     semiss_lw = [] # if iemis is not false, put 1 or 16 values (e.g. 0.945) by which to weight the emissivity (1 - reflectance) in different wavenumber bands
#     
#     f_lw.write('%10.3E' % atmosphere['surface temperature'] + ' ' + str(int(iemis)) + '  ' + \
#         str(int(ireflect)) + ''.join(['%5.3F' % i for i in semiss_lw]) + '\n')
#     
#     # RECORD 2.1
#     # assuming no ray tracing, e.g IATM == 0,
#     rows = []
#     paves = atmosphere['average pressures'] # average pressure for each layer in millibars
#     taves = atmosphere['average temperatures'] # average temperature for each layer in K (here, a dry adiabat)
#     PZ_Ls = atmosphere['top pressures'] # pressure at bottom of each layer in millibars
#     TZ_Ls = atmosphere['top temperatures'] # temperature at bottom of each layer in K
#     PZ_L_1 = atmosphere['surface pressure'] # pressure at bottom of atmosphere in millibars 
#     TZ_L_1 = atmosphere['surface temperature'] # temperature at bottom of atmosphere in K
#     nlayers = len(paves) # number of layers of atmosphere
#     nmol = max([MOLECULES.index(molecule) for molecule in atmosphere['concentrations'].keys() if not molecule == 'broadening gases']) # maximum "molecule number"
#     
#     rows.append({
#         2: int(True), # IFORM: read PAVE, WKL, WBORADL in E15.7 format, as opposed to F10.4, E10.3, E10.3 formats?
#         3: str(nlayers).rjust(3), # NLAYERS: how many layers (up to 200) do you want?
#         6: str(nmol).rjust(5) # NMOL: what's the maximum number associated with the molecules you're using? (see MOLECULES list below)
#     })
#     
#     # screwy things: Python formatting with '%10.3G' or any with 'G' will turn
#     # floats with no decimal part into integers, messing up the calculation...
#     # but using 'F' can lead to problems if the number needs to be scienfically
#     # notated. possible hack: add '0.00000001' to everything?
#     # for each layer, make a collection of rows
#     for i in range(nlayers):
#         # for each layer, make a row designating pressure and temperature
#         row = {
#             1: '%15.7F' % paves[i], # PAVE, see above:
#             16: '%10.4F' % taves[i], # TAVE, see above
#             71: '%8.5F' % PZ_Ls[i], # PZ(L), see above
#             79: '%7.2F' % TZ_Ls[i], # TZ(L), see above
#         }
#         
#         if i == 0:
#             row[49] = '%8.5F' % PZ_L_1
#             row[57] = '%7.2F' % TZ_L_1
#         rows.append(row)
#         
#         # for every seven radiatively active constituents, make a row of concentrations
#         # concentrations are in molcules per cm3
#         list_of_values = []
#         values = [None] * 7 + ['%15.7E' % atmosphere['concentrations']['broadening gases'][i]]
#         counter = 0
#         for molecule_number in range(len(MOLECULES)):
#             if 0 < molecule_number <= nmol:
#                 concentration = atmosphere['concentrations'][MOLECULES[molecule_number]][i]
#                 values[counter] =  '%15.7E' % concentration
#                 counter += 1
#                 if molecule_number in [nmol, 7, 15, 23, 31]: # the 8th place in the first row is occupied by broadening gases
#                     list_of_values.append(values)
#                     values = [None] * 8
#                     counter = 0
# 
#         for values in list_of_values:
#             row = {}
#             for index in range(len(values)):
#                 row[index * 15 + 1] = values[index]
#             rows.append(row)
#     
#     # write the rows to file
#     for row in rows:
#         line = make_indexed_line(row) # see method definition below
#         f_lw.write(line) 
#         f_sw.write(line)
#     
#     f_lw.write('%') # marks the end of the file
#     f_sw.write('%') # marks the end of the file
# 
#     f_lw.close()
#     f_sw.close()
# 
# def load_atmosphere(atmosphere):
#     # loads a dictionary from a data file stored in /atmospheres
#     f = open('atmospheres/' + atmosphere + '.json', 'r')
#     atmosphere = json.load(f)
#     f.close()
#     
#     return atmosphere
# 
# def make_indexed_line(entries):
#     # makes a fixed-width columned line; entires has keys that are strings and
#     # values that say the initial column at which to place the string
#     
#     line = [' '] * 120 # assuming a maximum line length of 120 characters
#     for index in entries:
#         entry = entries[index] # the description is 1-indexed, Python is 0-indexed
#         index -= 1
#         line[index:index + len(str(entry))] = list(str(entry))
#     
#     return ''.join(line).rstrip() + '\n'
# 
# def convert_output_files_to_json():
#     # TODO: add the distinction between diffusive and direct downward flux to sw
#     
#     response = {
#         'shortwave': {
#             'downward': [],
#             'upward': [],
#             'net': []
#         },
#         'longwave': {
#             'downward': [],
#             'upward': [],
#             'net': []
#         },
#         'total': {
#             'downward': [],
#             'upward': [],
#             'net': []
#         }
#     }
# 
#     with open('sw/OUTPUT_RRTM', 'r') as f:
#         for line in f:
#             if re.search(r'^\s*?\d', line):
#                 split_line = line.split()
#                 response['shortwave']['upward'].append(float(split_line[2]))
#                 response['shortwave']['downward'].append(float(split_line[5]))
#                 response['shortwave']['net'].append(float(split_line[6]))
#     
#     i = 0
#     with open('lw/OUTPUT_RRTM', 'r') as f:
#         for line in f:
#             if re.search(r'^\s*?\d', line):
#                 split_line = line.split()
#                 lw = response['longwave']
#                 sw = response['shortwave']
#                 total = response['total']
#                 
#                 lw['upward'].append(float(split_line[2]))
#                 lw['downward'].append(float(split_line[3]))
#                 lw['net'].append(float(split_line[4]))
#                 
#                 for direction in ['upward', 'downward', 'net']:
#                     total[direction].append(lw[direction][i] + sw[direction][i])
#                 
#                 i += 1
#                     
#     for outer_key in response:
#         for inner_key in response[outer_key]:
#             response[outer_key][inner_key].reverse()
#     
#     return json.dumps(response)
# 
#       
# # Now, the actual execution:
# 
# if len(sys.argv) > 1:
#     make_input_files(sys.argv[1])
# else:
#     if 'QUERY_STRING' in os.environ and len(os.environ['QUERY_STRING'].split('=')) > 1:
#         make_input_files(os.environ['QUERY_STRING'].split('=')[1])
#     else:
#         make_input_files()
# 
# chdir('sw')
# call(['./rrtm_sw'])
# chdir('..')
# chdir('lw')
# call(['./rrtm_lw'])
# chdir('..')
# 
# 
# print convert_output_files_to_json()