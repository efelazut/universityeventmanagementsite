namespace UniversityEventManagement.Api.Data;

public class InMemoryEntityStore<T> where T : class
{
    private readonly List<T> _items = new();
    private readonly Func<T, int> _getId;
    private readonly Action<T, int> _setId;
    private int _currentId;
    private readonly object _syncRoot = new();

    public InMemoryEntityStore(Func<T, int> getId, Action<T, int> setId)
    {
        _getId = getId;
        _setId = setId;
    }

    public IReadOnlyList<T> GetAll()
    {
        lock (_syncRoot)
        {
            return _items.ToList();
        }
    }

    public T? GetById(int id)
    {
        lock (_syncRoot)
        {
            return _items.FirstOrDefault(item => _getId(item) == id);
        }
    }

    public T Create(T item)
    {
        lock (_syncRoot)
        {
            var newId = ++_currentId;
            _setId(item, newId);
            _items.Add(item);

            return item;
        }
    }

    public bool Update(int id, T item)
    {
        lock (_syncRoot)
        {
            var index = _items.FindIndex(existingItem => _getId(existingItem) == id);
            if (index < 0)
            {
                return false;
            }

            _setId(item, id);
            _items[index] = item;

            return true;
        }
    }

    public bool Delete(int id)
    {
        lock (_syncRoot)
        {
            var item = _items.FirstOrDefault(existingItem => _getId(existingItem) == id);
            if (item is null)
            {
                return false;
            }

            _items.Remove(item);
            return true;
        }
    }
}
