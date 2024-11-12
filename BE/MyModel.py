from pydantic import BaseModel

class MyModel(BaseModel):

    def get_active_fields(self)->dict:
        """Get All active fields."""
        active = {}
        for field in self.model_fields:
            try:
                value = getattr(self, field)
                active[field] = value
            except: #noqa
                continue
        
        return active
