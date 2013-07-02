import json
from numpy import e, linspace, log

def input_file(atmosphere = 'midlatitude_summer'):
    if type(atmosphere) == str:
        atmosphere = load_atmosphere(atmosphere) # see method below
        
    # create temporary file
    f = open('input_rrtm_tmp', 'w')
    
    # RECORD 1.1
    f.write('$\n') # marks the beginning of the file
    
    rows = []
    
    # RECORD 1.2
    # for all "records", values are values, keys are what column they belong in
    rows.append({
        50: int(False), # IATM: do you want to use RRTATM, and atmospheric ray trace program?
        70: int(False), # IXSECT: do you want to use cross-sections?
        83: int(False), # ISCAT: which radiative transfer solver would you like to use? 0 == RRTM
        85: 3, # NUMANGS: using Gaussian quadrature, how many angles do you want to compute over?
        90: int(False), # IOUT: what sort of output do you want (do you want it separated into bins?)
        95: int(False) # ICLD: you want clouds with that?
    })
        
    # RECORD 1.4
    rows.append({
        1: 294.2, # TBOUND: what's the surface temperature in K?
        12: int(False), # IEMS: do you want to specify the surface emissivity in different bands?
        15: int(False) # IREFLECT: do you want specular reflection at the surface (like a mirror), as opposed to isotropic?
        # 1.0: 17 # SEMISS: what surface missivity do you want for each band?
    })
        
    # RECORD 2.1
    # assuming no ray tracing, e.g IATM == 0,

    MOLECULES = [None,
        'H2O', 'CO2', 'O3', 'N2O', 'CO', 'CH4', 'O2', 'NO', 'SO2', 'NO2', # 1 - 10
        'NH3', 'HNO3', 'OH', 'HF', 'HCL', 'HBR', 'HI', 'CLO', 'OCS', # 11 - 20
        'H2CO', 'HOCL', 'N2', 'HCN', 'CH3CL', 'H2O2', 'C2H2', 'C2H6', 'PH3', 'COF2', 'SF6', # 21 - 30
        'H2S', 'HCOOH' # 31 - 32
    ]
    
    paves = atmosphere['average pressures'] # average pressure for each layer in millibars
    taves = atmosphere['average temperatures'] # average temperature for each layer in K (here, a dry adiabat)
    PZ_Ls = atmosphere['top pressures'] # pressure at bottom of each layer in millibars
    TZ_Ls = atmosphere['top temperatures'] # temperature at bottom of each layer in K
    PZ_L_1 = atmosphere['surface pressure'] # pressure at bottom of atmosphere in millibars 
    TZ_L_1 = atmosphere['surface temperature'] # temperature at bottom of atmosphere in K
    nlayers = len(paves) # number of layers of atmosphere
    nmol = max([MOLECULES.index(molecule) for molecule in atmosphere['concentrations'].keys() if not molecule == 'broadening gases']) # maximum "molecule number"
    
    rows.append({
        2: int(True), # IFORM: read PAVE, WKL, WBORADL in E15.7 format, as opposed to F10.4, E10.3, E10.3 formats?
        3: str(nlayers).rjust(3), # NLAYERS: how many layers (up to 200) do you want?
        6: str(nmol).rjust(5) # NMOL: what's the maximum number associated with the molecules you're using? (see MOLECULES list below)
    })
    
    # for each layer, make a collection of rows
    for i in range(nlayers):
        # for each layer, make a row designating pressure and temperature
        row = {
            1: '%15.7G' % paves[i], # PAVE, see above:
            16: '%10.4G' % taves[i], # TAVE, see above
            71: '%8.3F' % PZ_Ls[i], # PZ(L), see above
            79: '%7.2F' % TZ_Ls[i], # TZ(L), see above
        }
        
        if i == 0:
            row[49] = '%8.3G' % PZ_L_1
            row[57] = '%7.2G' % TZ_L_1
        rows.append(row)
        
        # for every seven radiatively active constituents, make a row of concentrations
        # concentrations are in molcules per cm3
        list_of_values = []
        values = [None] * 7 + ['%15.7G' % atmosphere['concentrations']['broadening gases'][i]]
        counter = 0
        for molecule_number in range(len(MOLECULES)):
            if 0 < molecule_number <= nmol:
                concentration = atmosphere['concentrations'][MOLECULES[molecule_number]][i]
                values[counter] =  '%15.7G' % concentration
                counter += 1
                if molecule_number in [nmol, 7, 15, 23, 31]: # the 8th place in the first row is occupied by broadening gases
                    list_of_values.append(values)
                    values = [None] * 8
                    counter = 0

        for values in list_of_values:
            row = {}
            for index in range(len(values)):
                row[index * 15 + 1] = values[index]
            rows.append(row)
    
    # write the rows to file
    for row in rows:
        f.write(make_indexed_line(row)) # see method definition below
    
    f.write('%') # marks the end of the file
    
    f.close()

def load_atmosphere(atmosphere):
    # loads a dictionary from a data file stored in /atmospheres
    
    f = open('atmospheres/' + atmosphere + '.json', 'r')
    
    atmosphere = json.load(f)
    
    f.close()
    
    return atmosphere
    
    

def make_indexed_line(entries):
    # makes a fixed-width columned line; entires has keys that are strings and
    # values that say the initial column at which to place the string
    
    line = [' '] * 120 # assuming a maximum line length of 120 characters
    for index in entries:
        entry = entries[index] # the description is 1-indexed, Python is 0-indexed
        index -= 1
        line[index:index + len(str(entry))] = list(str(entry))
    
    return ''.join(line).rstrip() + '\n'
    
input_file()