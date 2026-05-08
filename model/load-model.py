# from transformers import AutoTokenizer, AutoModel

# model_id = "talhabangyal/mistral-medx"
# token = "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"

# tokenizer = AutoTokenizer.from_pretrained(model_id, use_auth_token=token)
# model = AutoModel.from_pretrained(model_id, use_auth_token=token)

# # Save locally
# save_path = "./local_model"

# model.save_pretrained(save_path)
# tokenizer.save_pretrained(save_path)

# print(f"Model saved to {save_path}")

from transformers import AutoTokenizer, AutoModel

model_id = "talhabangyal/mistral-medx"
token = "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"

tokenizer = AutoTokenizer.from_pretrained(model_id, token=token)
model = AutoModel.from_pretrained(model_id, token=token)

# Save locally
save_path = "./local_model"

model.save_pretrained(save_path)
tokenizer.save_pretrained(save_path)

print(f"Model saved to {save_path}")