from debug import g_error, g_debug

from copy import deepcopy
import openpyxl

NUMBER_OF_ALPHABETS = 26

class WidgetExcel:

    DEBUG_MODE = True
    VERBOSE_MODE = False

    def __init__(self, file_path:str) -> None:
        self.workbook = openpyxl.load_workbook(file_path, data_only=True)
        self.ascii_a = ord('A')

    def _create_reference(self, row:int, column:int)->str:
        letter_reference = ''        
        letter_count = int(column/(NUMBER_OF_ALPHABETS+1))
        for letter in range(letter_count+1):
            remainder = column % NUMBER_OF_ALPHABETS
            letter_reference += chr(remainder + self.ascii_a)
            column -= NUMBER_OF_ALPHABETS
        
        return f'{letter_reference}{row+1}'
    
    def _get_worksheet(self, worksheet_name:str):
        if worksheet_name not in self.workbook.sheetnames:
            g_error(f'Invalid worksheet = {worksheet_name} in ',up_stack=2)
            return None
        
        return self.workbook[worksheet_name]

    def _table_headers(self, worksheet, row_offset:int, column:int)->list:
        headers = []        
        while True:
            reference = self._create_reference(row_offset, column)
            cell = worksheet[reference]
            if cell.value is None:
                break

            headers.append(cell.value)
            column = column + 1
        
        return headers
    
    def _table_read_row(self, worksheet, row:int, column_offset:int, headers:list)->dict|None:        
        row_data = {}        

        valid_value = False
        for column in range(column_offset, column_offset+len(headers)):
            reference = self._create_reference(row, column)
            cell = worksheet[reference]
            row_data[headers[column]] = cell.value
            if cell.value is not None:
                valid_value = True

        if valid_value == False:
            return None
        
        return row_data
    
    def table_header(self, worksheet_name:str, row_offset:int, column_offset:int)->list:
        worksheet = self._get_worksheet(worksheet_name)
        if worksheet is None:
            return []
        
        return self._table_headers(worksheet, row_offset, column_offset)            

    def table(self, worksheet_name:str, row_offset:int, column_offset:int)->list[dict]: 
        worksheet = self._get_worksheet(worksheet_name)
        if worksheet is None:
            return []       
                        
        headers = self._table_headers(worksheet, row_offset, column_offset)
        table = []

        row = row_offset + 1
        while True:
            data_row = self._table_read_row(worksheet, row, column_offset, headers)
            if data_row is None:
                break

            row = row + 1
            table.append(data_row)

        return table
    
    def table_filter_headers(self, table_original:list[dict], headers:list[str], remove:bool)->list[dict]:
        table = deepcopy(table_original)

        for row in table:
            available_headers = list(row.keys())
            for available_header in available_headers:
                if remove is True and available_header in headers:
                    del row[available_header]

                if remove is False and available_header not in headers:
                    del row[available_header]
        
        return table
    
    def table_filter_rows(self, table:list[dict], header:str, values:list)->list[dict]:
        filtered = []        
        for row in table:
            if header not in row:
                continue
            
            for value in values:
                if row[header] == value:
                    filtered.append(row)    
                    break
                        
        return filtered
    
    def table_get_unique_values(self, table:list[dict], filter:dict, header:str)->list[str]:
        unique_values = []
        filter_headers = filter.keys()
        for row in table:
            skip = False
            for filter_header in filter_headers:
                try:
                    if row[filter_header] != filter[filter_header]:
                        skip = True
                        break
                except Exception as e:
                    g_error(f'Failed to get fitler header. Reason = {e}')
                    skip = True
                    break
            
            if skip == True:
                continue
            
            try:
                value = row[header]
            except Exception as e:
                g_error(f'Invalid header = {header}. Header not in row = {row.keys()}')
                continue

            if value not in unique_values:
                unique_values.append(value)
            
        return unique_values
    
    def table_get_row(self, table:list[dict], header:str, value)->dict:
        for row in table:
            if header not in row:
                continue
            
            if row[header] == value:
                return row            

        g_error(f'Could not find {value} of {header} in table')

        return {}

