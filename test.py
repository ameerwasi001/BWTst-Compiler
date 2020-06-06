from Extensions import Helper
from Values import *
helper = Helper()

############### Generated Code ####################

getattr(helper, 'start')(BWTString("chrome"), BWTString("C:/Browserdriver/chromedriver.exe") )
(wait := BWTNumber(5))
(website := BWTString("https://www.google.com/"))
(button := BWTString("to Click"))
def context_428615187508955738617739945326178663412512814446478059118377658595(): 	
	current = BWTNumber(0)
	while ((current.copy()).lte(BWTNumber(3))).value: 	
		getattr(helper, 'visit')(BWTString("https://www.python.org/") )
		getattr(helper, 'get_element_by_link_text')(BWTString("absolute"), BWTString("Become a Member") , index = button.copy())
		getattr(helper, 'click')(button.copy() )
		getattr(helper, 'sleep')(((current.copy()).added_to(BWTNumber(2))) )
		getattr(helper, 'get_element_by_id')(BWTString("id_login"), BWTString("username") )
		getattr(helper, 'write')(BWTString("username"), BWTString("ameerShah@gmail.com") , enter = false.copy())
		getattr(helper, 'get_element_by_id')(BWTString("id_password"), BWTString("password") )
		getattr(helper, 'write')(BWTString("password"), BWTString("helloameer") , enter = false.copy())
		getattr(helper, 'get_element_by_class')(BWTString("primaryAction"), BWTString("submit") )
		getattr(helper, 'click')(BWTString("submit") )
		getattr(helper, 'sleep')(((current.copy()).added_to(BWTNumber(2))) )
		current = (current.copy()).added_to(BWTNumber(1))
		
	return nil
	
context_428615187508955738617739945326178663412512814446478059118377658595()
getattr(helper, 'close')( )